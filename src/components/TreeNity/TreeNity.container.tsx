import * as d3 from "d3"
import './TreeNity.scss'
import React, { FC, useState, useEffect } from 'react'
import { Links, Nodes, Labels } from 'components/index'
// TODO: fix graph persist
// import useLocalStorage from "../../hooks/useLocalStorage"

interface Props {
  width: number
  height: number
  rawSignal: signalType
  handleClickSignal: Function
}

const TreeNity: FC<Props> = ({
  width, height, rawSignal, handleClickSignal
}) => {

  // constants

  const [source, setSource] = useState<number | null>(null)
  const [target, setTarget] = useState<number>(0)
  const [graph, setGraph] = useState<d3Graph>({
    nodes: [{
      id: "ORIGIN",
      group: 4
    }],
    links: [],
  })

  const [treeState, setTreeState] = useState<any>({
    A: {},
    B: {},
    C: {},
  })

  let signal: signalType
  if (rawSignal) {
    signal = rawSignal[0]
  }

  // simulation

  let simulation: any = d3.forceSimulation(graph.nodes)
    .force("link", d3.forceLink().id((d: any) => d.id))
    .force("charge", d3.forceManyBody().strength(-100))
    .force("center", d3.forceCenter(width / 2, height / 2))

  simulation.force("link").links(graph.links)

  // useEffects

  useEffect(() => {
    if (rawSignal) {
      _handleNewSignal()
    }
  }, [rawSignal])

  useEffect(() => {
    if (rawSignal) {
      _createNodeEntry()
    }
  }, [treeState])

  useEffect(() => {
    const node = d3.selectAll(".node")
    const link = d3.selectAll(".link")
    const label = d3.selectAll(".label")

    function tick() {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y)

      node
        .attr("cx", (d: any) =>
          d.x = Math.max(5, Math.min(width - 5, d.x)))
        .attr("cy", (d: any) =>
          d.y = Math.max(5, Math.min(height - 5, d.y)))

      label
        .attr("x", (d: any) => d.x + 5)
        .attr("y", (d: any) => d.y + 5)
    }

    simulation.nodes(graph.nodes).on("tick", tick)
    simulation.force("link").links(graph.links)
  }, [target])

  // methods

  function _handleNewSignal() {
    const newTargetId = Object.keys(treeState[signal]).length
    let [newSourceId, leftChild, rightChild]: any = [null, null, null]

    if (newTargetId > 0) {
      // FIXME: REFACTOR ME SO I'M NOT A FOR LOOP, BE MATHY :D
      for (let i = 0; i < newTargetId; i++) {
        let node = treeState[signal][i]
        if (!node.leftChild) {
          node.leftChild = newTargetId
          newSourceId = i;
          break
        } else if (!node.rightChild) {
          node.rightChild = newTargetId
          newSourceId = i;
          break
        }
      }
    }

    const targetObj = {
      source: newSourceId,
      leftChild,
      rightChild,
    }
    const newTree = {
      ...treeState,
      [signal]: {
        ...treeState[signal],
        [newTargetId]: targetObj
      }
    }

    setSource(newSourceId)
    setTarget(newTargetId)
    setTreeState(newTree)
  }

  // signal is (A, B, or C) & it represents the tree that is being updated
  function _createNodeEntry() {
    let group: number

    switch (signal) {
      case "A":
        group = 1; break
      case "B":
        group = 2; break
      case "C":
        group = 3; break
      default:
        throw new Error(`Gurrlll this ain't A B nor C. Check yoself. Wut came thru for signal: ${signal}`)
    }

    const newGraph = {
      nodes: graph.nodes.concat({
        id: `${signal}${target}`,
        group
      }),
      links: _createLinkEntry()
    }

    simulation.stop()
    setGraph(newGraph)
    simulation.restart()
    simulation.alpha(1)
  }


  function _createLinkEntry() {
    if (source !== null) {
      return graph.links.concat(
        {
          source: `${signal}${source}`,
          target: `${signal}${target}`,
          value: 5
        }
      )
    } else {
      return graph.links.concat(
        {
          source: "ORIGIN",
          target: `${signal}${target}`,
          value: 5
        }
      )
    }
  }

  return (
    <div id="viz-container">
      <svg className="viz-mount" width={width} height={height}>
        <Links links={graph.links}/>
        <Nodes nodes={graph.nodes} simulation={simulation}/>
        <Labels nodes={graph.nodes}/>
      </svg>
      <div id="btn-container">
        <button onClick={() => handleClickSignal("A")}>ADD BLUE NODE</button>
        <button onClick={() => handleClickSignal("B")}>ADD GREEN NODE</button>
        <button onClick={() => handleClickSignal("C")}>ADD RED NODE</button>
      </div>
    </div>
  )
};

export default TreeNity;
