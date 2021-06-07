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
    this.height = height || 300
    let element = document.getElementById(el)
    if (!width) {
      this.width = element.offsetWidth
    } else {
      this.width = width
    }
  }

  resetSvg() {
    d3.select(this.el)
      .select("svg")
      .remove();
    this.initTree()
  }
  sortChild(arr) {
    let left = [],
      right = []
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
    list = list.map((v, k) => {
      v.index = k
      return v
    })
    return list
  }
  sortNodes() {
    let obj = {}
    let list = []
    if (this.links.length) {
      this.links.forEach(v => {
        let level = v.level
        if (!obj[level]) {
          obj[level] = []
        }
        obj[level].push(v)
      })
      for (let i in obj) {
        list = list.concat(this.sortChild(obj[i]))
      }
    }
    return list
  }
  initTree() {
    let list = this.sortNodes()
    let nodes = {}
    this.nodes.forEach(v => {
      nodes[v.kh] = v
    })
    let sourceNode = {}
    // 计算节点  节点 id： level + '-'+ kh
    list = list.map(v => {
      if (v.level == -1) {
        this.parentId = v.target
        this.defaultQuery = {
          dfje: v.weight,
          jysj: v.jysj
        }
      }
      let level = v.level == -1 ? 0 : v.level
      let sourceId = level + '-' + v.source
      let targetId = (level + 1) + '-' + v.target
      if (!sourceNode[sourceId]) {
        sourceNode[sourceId] = { ...nodes[v.source],
          targetId: sourceId
        }
      }
      if (!sourceNode[targetId]) {
        sourceNode[targetId] = { ...nodes[v.target],
          targetId: targetId
        }
      }
      v.sourceId = sourceId
      v.targetId = targetId
      return v
    })
    this.nodeData = Object.values(sourceNode)
    this.nodeData = this.nodeData.map(v => {
      v.link = list.find(e => {
        return e.targetId == v.targetId
      })
      return v
    })

    this.initWidth()
    if (this.nodeData.length < 1) {
      return false;
    } else {
      this.drawTree();
    }
  }
  initWidth() {
    if (this.isFixed) {
      this.width = window.innerWidth
      this.height = window.innerHeight;
      this.start.x = 0
      this.start.y = 0
    } else {
      let conf = this.$refs.wraptree.getBoundingClientRect()
      this.width = conf.width || 1000
      this.height = window.innerHeight - conf.top;
      this.start.x = conf.left
      this.start.y = conf.top
    }
  }
  drawTree() {

    this.svg = d3.select(this.$refs.mytree).append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr('id', 'fytree')

    let nlen = this.nodeData.length.toString().length
    let num = this.nodeData.length.toString().substring(0, 1)
    this.scalex = this.nodeData.length > 8 ? 3 : 1
    if (nlen >= 3) {
      this.scalex = 6 + num * nlen
    } else if (nlen == 2) {
      this.scalex = 6
    }
    let root
    try {
      root = d3.stratify()
        .id((d) => {
          return d.targetId;
        })
        .parentId((d) => {
          if (!d.link) {
            return ''
          } else {
            return d.link.sourceId
          }
        })(this.nodeData);
    } catch (e) {
      this.$message.error('层级关系错误:生成图形失败')
      console.log('层级关系错误', e)
    }
    this.hierarchyData = d3.hierarchy(root)
      .sum((d) => {
        return d.data.link ? d.data.link.index || 0 : 0
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

    this.zoom = d3.zoom()
      .scaleExtent(this.scale)
      .translateExtent([
        [0, 0],
        [this.width, this.height]
      ])
      .extent([
        [0, 0],
        [this.width, this.height]
      ])
      .on('zoom', this.zoomed)

    this.g = this.svg.append('g').attr('class', 'mywrap').attr('id', 'treeg')

    this.initDefineSymbol()
    this.drawNodes()
    this.drawLinks()
    this.svg.call(d3.zoom().on("zoom", this.zoomed)).on('click', () => {
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

        let baseNum = 40,
          baseY = 60
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
      d.y = d.depth * 200 + 24;
      d.x = d.x * this.scalex + 24;
      d.value = d.data.data.id;
      if (d.data.data.kh == that.parentId && d.data.data.link.level < 1) {
        this.start.tx = -(d.x - this.width / 2)
        this.start.ty = -(d.y - this.height / 2)
      }
    });
    if (that.parentId) {
      this.zoomReset()
    }

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
        let image = manPic
        if (d.data.data.kh == that.parentId) {
          image = menPic
        }
        if (d.data.data.targetId == that.nodeClick) {
          image = nanPic
        }
        d3.select(this)
          .append("image")
          .attr("width", imgW)
          .attr("height", imgW)
          .attr('transform', () => {
            return 'translate(-' + imgW / 2 + ',-' + imgW / 2 + ')'
          })
          .attr("xlink:href", (d) => {
            return image
          })
          .on('mousemove', function(d) {
            d3.select(this).attr("xlink:href", nanPic)
          })
          .on('mouseleave', function() {
            d3.select(this).attr("xlink:href", (d) => {
              return image
            })
          }).on("click", function(d) {
            that.clickDetail(d)
          })
      })
    this.drawNodeText();
  }
  drawNodeText() {

    let fontColor = '#606266',
      fontSize = 11,
      fontAlign = 'middle',
      that = this

    // 交易时间 转出次数
    this.g.selectAll('.node').append('text')
      .attr('dy', -(imgW))
      .attr('font-size', fontSize)
      .style('text-anchor', fontAlign)
      .style('color', fontColor)
      .text((d) => {
        let link = d.data.data.link,
          title = ''
        if (link) {
          title = link.jysj || '次数:' + link.fequencies
        }
        return title
      }).on("click", function(d) {
        that.clickDetail(d)
      })

    // 金额
    this.g.selectAll('.node').append('text')
      .attr('dy', -(imgW * 0.6))
      .attr('font-size', fontSize)
      .style('text-anchor', fontAlign)
      .style('color', fontColor)
      .text((d) => {
        return d.data.data.link ? d.data.data.link.weight : ''
      }).on("click", function(d) {
        that.clickDetail(d)
      })

    this.g.selectAll('.node').append('text')
      .attr('dy', imgW * 4 / 5)
      .attr('font-size', fontSize)
      .style('text-anchor', fontAlign)
      .style('color', fontColor)
      .text((d) => {
        return d.data.data.mc || ''
      })

    this.g.selectAll('.node').append('text')
      .attr('dy', imgW * 3 / 4 + 20)
      .attr('font-size', fontSize)
      .style('text-anchor', fontAlign)
      .style('color', fontColor)
      .text((d) => {
        return d.data.data.kh
      })
  }
  clickDetail(d) {
    let {
      source,
      target,
      targetId,
      level
    } = d.data.data.link
    if (level < 0) {
      return
    }
    this.nodeClick = targetId
    let param = {
      jdbz: '出',
      source: source,
      target: target,
      dataSource: this.dataSource,
      ...this.defaultQuery
    }
    this.requestDetail = [{
      url: '/api/singleBillAnalysis/queryLinkDetails',
      param: param,
      noPage: true
    }]
  }
  zoomed() {
    this.g.attr('transform', d3.event.transform)
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
};



