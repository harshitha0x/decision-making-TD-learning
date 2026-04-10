import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

function generateTopology(numRouters) {
  const W = 700, H = 500;
  const nodes = [{ id: 'Source', x: 80, y: H / 2, label: 'SRC', type: 'source' }];

  const spread = Math.min(380, numRouters * 85);
  const startY = H / 2 - spread / 2;
  for (let i = 0; i < numRouters; i++) {
    const y = numRouters === 1 ? H / 2 : startY + (spread / (numRouters - 1)) * i;
    nodes.push({ id: `R${i + 1}`, x: W / 2, y, label: `R${i + 1}`, type: 'router' });
  }
  nodes.push({ id: 'Dest', x: W - 80, y: H / 2, label: 'DST', type: 'dest' });

  const links = [];
  for (let i = 1; i <= numRouters; i++) {
    links.push({ source: 'Source', target: `R${i}` });
    links.push({ source: `R${i}`, target: 'Dest' });
  }
  return { nodes, links, W, H };
}

function initValues(numRouters) {
  const v = { Source: 0, Dest: 10 };
  for (let i = 1; i <= numRouters; i++) v[`R${i}`] = 5;
  return v;
}

export default function NetworkGraph({
  onUpdate, alpha, gamma, congestion, setCongestion,
  packetSize, reward, congestionCost,
  onSimStart, onSimEnd, numRouters,
}) {
  const svgRef = useRef();
  const [values, setValues] = useState(() => initValues(numRouters));
  const [busy, setBusy] = useState(false);
  const [lastPath, setLastPath] = useState(null);
  const valuesRef = useRef(values);
  const topoRef = useRef(generateTopology(numRouters));

  useEffect(() => { valuesRef.current = values; }, [values]);

  useEffect(() => {
    topoRef.current = generateTopology(numRouters);
    setValues(initValues(numRouters));
    setLastPath(null);
  }, [numRouters]);
  useEffect(() => {
    const { nodes, links, W, H } = topoRef.current;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    const addGlow = (id, color, std) => {
      const f = defs.append('filter').attr('id', id).attr('x', '-60%').attr('y', '-60%').attr('width', '220%').attr('height', '220%');
      f.append('feGaussianBlur').attr('stdDeviation', std).attr('result', 'blur');
      const m = f.append('feMerge');
      m.append('feMergeNode').attr('in', 'blur');
      m.append('feMergeNode').attr('in', 'SourceGraphic');
    };
    addGlow('glow', '#a855f7', 1.5);
    addGlow('redGlow', '#ef4444', 6);
    addGlow('cyanGlow', '#06b6d4', 5);

    const pg = defs.append('radialGradient').attr('id', 'pktGrad');
    pg.append('stop').attr('offset', '0%').attr('stop-color', '#e9d5ff');
    pg.append('stop').attr('offset', '100%').attr('stop-color', '#7c3aed');

    // Links
    links.forEach(link => {
      const s = nodes.find(n => n.id === link.source);
      const t = nodes.find(n => n.id === link.target);
      svg.append('line')
        .attr('class', `lnk lnk-${link.source}-${link.target}`)
        .attr('x1', s.x).attr('y1', s.y)
        .attr('x2', t.x).attr('y2', t.y)
        .attr('stroke', '#ffffff08').attr('stroke-width', 1.5);
    });

    // Nodes
    nodes.forEach(node => {
      const isRouter = node.type === 'router';
      const isDest = node.type === 'dest';
      const isSrc = node.type === 'source';
      const R = isRouter ? 36 : 40;
      const strokeBase = isDest ? '#a855f7' : isSrc ? '#06b6d4' : '#ffffff18';

      const g = svg.append('g')
        .attr('class', `nd nd-${node.id}`)
        .style('cursor', isRouter ? 'pointer' : 'default');

      // Outer ring
      g.append('circle')
        .attr('cx', node.x).attr('cy', node.y).attr('r', R + 11)
        .attr('fill', 'none')
        .attr('stroke', strokeBase).attr('stroke-width', 0.7)
        .attr('stroke-dasharray', isRouter ? '3 5' : 'none')
        .attr('opacity', 0.3);

      // Body
      g.append('circle')
        .attr('class', `nc nc-${node.id}`)
        .attr('cx', node.x).attr('cy', node.y).attr('r', R)
        .attr('fill', isDest ? '#180a2e' : isSrc ? '#001822' : '#0b0b1e')
        .attr('stroke', strokeBase).attr('stroke-width', 1.8);

      // Label
      g.append('text')
        .attr('x', node.x).attr('y', node.y - 11)
        .attr('text-anchor', 'middle')
        .attr('fill', isDest ? '#c084fc' : isSrc ? '#67e8f9' : '#ffffff55')
        .attr('font-size', '9px').attr('font-weight', '900').attr('letter-spacing', '2px')
        .text(node.label);

      // Value
      g.append('text')
        .attr('class', `vt vt-${node.id}`)
        .attr('x', node.x).attr('y', node.y + 8)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white').attr('font-size', '15px').attr('font-weight', '900').attr('font-family', 'monospace')
        //.style('filter', 'url(#glow)')
        .text('0.0');

      // Jam tag
      g.append('text')
        .attr('class', `jt jt-${node.id}`)
        .attr('x', node.x).attr('y', node.y + 24)
        .attr('text-anchor', 'middle')
        .attr('font-size', '7px').attr('font-weight', 'bold')
        .attr('fill', '#ef4444bb').text('');

      if (isRouter) {
        g.on('click', () => setCongestion(p => ({ ...p, [node.id]: !p[node.id] })));
      }
    });
  }, [numRouters]);

  // Update values + congestion visuals
  useEffect(() => {
    const { nodes } = topoRef.current;
    const svg = d3.select(svgRef.current);
    nodes.forEach(node => {
      const v = values[node.id];
      if (v !== undefined) svg.select(`.vt-${node.id}`).text(v.toFixed(1));

      const jammed = !!congestion[node.id];
      const isDest = node.type === 'dest', isSrc = node.type === 'source';
      svg.select(`.nc-${node.id}`)
        .attr('stroke', jammed ? '#ef4444' : isDest ? '#a855f7' : isSrc ? '#06b6d4' : '#ffffff18')
        .style('filter', jammed ? 'url(#redGlow)' : null);
      svg.select(`.jt-${node.id}`).text(jammed ? 'JAMMED' : '');
    });
  }, [values, congestion]);

  const runSim = useCallback(() => {
    if (busy) return;
    setBusy(true);
    onSimStart?.();

    const { nodes } = topoRef.current;
    const cur = valuesRef.current;
    const svg = d3.select(svgRef.current);
    const pr = Math.max(7, Math.min(16, packetSize / 220));

    const routers = nodes.filter(n => n.type === 'router');
    const scored = routers.map(r => ({
      node: r,
      score: cur[r.id] - (congestion[r.id] ? 8 : 0) + Math.random() * 0.3,
    }));
    scored.sort((a, b) => b.score - a.score);
    const chosen = scored[0].node;

    const jammed = !!congestion[chosen.id];
    const R = jammed ? congestionCost : reward;
    const src = nodes.find(n => n.id === 'Source');
    const dst = nodes.find(n => n.id === 'Dest');

    const activeLinks = [`lnk-Source-${chosen.id}`, `lnk-${chosen.id}-Dest`];
    activeLinks.forEach(cls =>
      svg.select(`.${cls}`).attr('stroke', jammed ? '#ef444477' : '#a855f777').attr('stroke-width', 2.5)
    );

    const pkt = svg.append('g');
    pkt.append('circle').attr('cx', src.x).attr('cy', src.y).attr('r', pr)
      .attr('fill', 'url(#pktGrad)').style('filter', 'url(#glow)');
    pkt.append('text').attr('x', src.x).attr('y', src.y + 4)
      .attr('text-anchor', 'middle').attr('fill', 'white')
      .attr('font-size', '7px').attr('font-weight', 'bold')
      .text(jammed ? '✕' : '►');

    pkt.transition().duration(850).ease(d3.easeCubicInOut)
      .attr('transform', `translate(${chosen.x - src.x},${chosen.y - src.y})`)
      .on('end', () => {
        const oldV = cur.Source;
        const nextV = cur[chosen.id];
        const tdErr = R + gamma * nextV - oldV;
        const newV = oldV + alpha * tdErr;

        setValues(p => ({ ...p, Source: parseFloat(newV.toFixed(4)) }));
        onUpdate?.({ oldValue: oldV, newValue: newV, tdError: tdErr, reward: R, nextValue: nextV, path: chosen.id });

        svg.select(`.nc-${chosen.id}`)
          .transition().duration(150).attr('r', 44)
          .transition().duration(150).attr('r', 36);

        pkt.transition().duration(700).ease(d3.easeCubicInOut)
          .attr('transform', `translate(${dst.x - src.x},${dst.y - src.y})`)
          .style('opacity', 0)
          .on('end', () => {
            pkt.remove();
            activeLinks.forEach(cls =>
              svg.select(`.${cls}`).transition().duration(600)
                .attr('stroke', '#ffffff08').attr('stroke-width', 1.5)
            );
            setBusy(false);
            setLastPath(chosen.id);
            onSimEnd?.();
          });
      });
  }, [busy, alpha, gamma, congestion, packetSize, reward, congestionCost, onUpdate, onSimStart, onSimEnd]);

  const routers = topoRef.current.nodes.filter(n => n.type === 'router');

  return (
    <div className="flex flex-col h-full w-full p-3 gap-2">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-mono text-white/30 px-1">
        <span>SRC: <span className="text-cyan-400/80">{(values.Source ?? 0).toFixed(3)}</span></span>
        {routers.map(r => (
          <span key={r.id}>
            {r.id}: <span className={congestion[r.id] ? 'text-red-400' : 'text-white/50'}>{(values[r.id] ?? 0).toFixed(1)}</span>
          </span>
        ))}
        <span>DST: <span className="text-purple-400">{(values.Dest ?? 0).toFixed(1)}</span></span>
        {lastPath && <span>→ <span className="text-amber-400">{lastPath}</span></span>}
      </div>
      <div className="flex-1 min-h-0 w-full">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${topoRef.current.W} ${topoRef.current.H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
        />
      </div>

      <div className="text-center text-[15px] text-white/100">
         Click any of the routers to cause congestion 
      </div>

      <button
        onClick={runSim}
        disabled={busy}
        className={`w-full py-4 font-black rounded-2xl border transition-all text-[11px] uppercase tracking-[0.4em] ${
          busy
            ? 'bg-white/3 border-white/5 text-white/20 cursor-not-allowed'
            : 'bg-purple-950/60 border-purple-500/40 hover:bg-purple-700/70 hover:border-purple-400 text-white shadow-lg shadow-purple-900/30 active:scale-[0.98]'
        }`}
      >
        {busy ? '…' : '  Send Packet'}
      </button>
    </div>
  );
}
