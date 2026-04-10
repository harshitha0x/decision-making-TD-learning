import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const NetworkGraph = ({ onUpdate, alpha, gamma, congestion, packetSize }) => {
  const svgRef = useRef();
  const [values, setValues] = useState({ Source: 0, R1: 0, R2: 0, Dest: 10 });

  const nodes = [
    { id: 'Source', x: 80, y: 200 },
    { id: 'R1', x: 300, y: 100 },
    { id: 'R2', x: 300, y: 300 },
    { id: 'Dest', x: 520, y: 200 }
  ];

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const links = [
      { source: nodes[0], target: nodes[1] }, { source: nodes[0], target: nodes[2] },
      { source: nodes[1], target: nodes[3] }, { source: nodes[2], target: nodes[3] }
    ];

    svg.selectAll("line").data(links).enter().append("line")
      .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x).attr("y2", d => d.target.y)
      .attr("stroke", "#ffffff05").attr("stroke-width", 2);

    const nodeGroups = svg.selectAll("g").data(nodes).enter().append("g");
    
    nodeGroups.append("circle")
      .attr("cx", d => d.x).attr("cy", d => d.y).attr("r", 38)
      .attr("fill", d => d.id === 'Dest' ? '#a855f711' : '#020617')
      .attr("stroke", d => {
          if (d.id === 'R1' && congestion.R1 > 1) return '#ef4444';
          if (d.id === 'R2' && congestion.R2 > 1) return '#ef4444';
          return d.id === 'Dest' ? '#a855f7' : '#ffffff10';
      })
      .attr("stroke-width", 2.5);

    nodeGroups.append("text")
      .attr("x", d => d.x).attr("y", d => d.y + 5).attr("text-anchor", "middle")
      .attr("fill", "white").attr("font-size", "11px").attr("font-weight", "900")
      .style("text-shadow", "0px 0px 10px rgba(0,0,0,1)")
      .text(d => values[d.id].toFixed(1));
  }, [values, congestion]);

  const runSim = () => {
    const svg = d3.select(svgRef.current);
    const packetRad = Math.max(6, Math.min(18, packetSize / 150));
    
    const packet = svg.append("circle")
      .attr("cx", nodes[0].x).attr("cy", nodes[0].y).attr("r", packetRad)
      .attr("fill", "#d8b4fe").style("filter", "drop-shadow(0 0 15px #a855f7)");

    const nextNode = values.R1 >= values.R2 ? nodes[1] : nodes[2];
    const cost = (nextNode.id === 'R1' && congestion.R1 > 1) || (nextNode.id === 'R2' && congestion.R2 > 1) ? -15 : -1;

    packet.transition().duration(1000).ease(d3.easeCubicInOut).attr("cx", nextNode.x).attr("cy", nextNode.y).on("end", () => {
      const newValue = values.Source + alpha * (cost + gamma * values[nextNode.id] - values.Source);
      setValues(prev => ({ ...prev, Source: newValue }));
      onUpdate(newValue);

      packet.transition().duration(800).attr("cx", nodes[3].x).attr("cy", nodes[3].y).style("opacity", 0).on("end", () => packet.remove());
    });
  };

  return (
    <div className="flex flex-col items-center h-full justify-between">
      <svg ref={svgRef} viewBox="0 0 600 400" className="w-full h-auto drop-shadow-2xl"></svg>
      <button onClick={runSim} className="w-full py-5 bg-purple-900 border border-purple-500/50 hover:bg-purple-600 text-white font-black rounded-3xl shadow-2xl transition-all active:scale-95 uppercase tracking-[0.5em] text-[11px]">
        Signal_Pulse_Signal
      </button>
    </div>
  );
};

export default NetworkGraph;