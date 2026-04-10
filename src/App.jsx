import { useState } from 'react'
import NetworkGraph from './NetworkGraph'
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const MODALS = {
  learn: { title: "TD Learning", accent: "cyan" },
  help: { title: "How to Use This Simulator", accent: "violet" },
  download: { title: "References & Further Reading", accent: "emerald" },
  'developed by': { title: "Developed By", accent: "amber" },
};

export default function App() {
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);

  const [alpha, setAlpha] = useState(0.5);
  const [gamma, setGamma] = useState(0.8);
  const [packetSize, setPacketSize] = useState(512);
  const [reward, setReward] = useState(-1);
  const [congestionCost, setCongestionCost] = useState(-15);
  const [numRouters, setNumRouters] = useState(2);
  const [congestion, setCongestion] = useState({});
  const [stepMode, setStepMode] = useState(false);
  const [stepData, setStepData] = useState(null);

  const addLog = (text, level = "info") => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [{ text: `[${time}] ${text}`, level }, ...prev].slice(0, 20));
  };

  const updateHistory = (data) => {
    addLog(`TD=${data.tdError.toFixed(3)} V=${data.newValue.toFixed(3)} via ${data.path}`, "update");
    setHistory(prev => [...prev, {
      step: prev.length + 1,
      value: parseFloat(data.newValue.toFixed(3)),
      tdError: parseFloat(data.tdError.toFixed(3)),
    }]);
    if (stepMode) setStepData(data);
  };

  const resetSim = () => {
    setHistory([]);
    setStepData(null);
    setCongestion({});
    setLogs([]);
  };

  const handleNumRouters = (n) => {
    setNumRouters(n);
    setCongestion({});
    setHistory([]);
    setStepData(null);
  };

  const logColor = (level) => ({
    sys: "text-cyan-400", net: "text-green-400",
    update: "text-purple-300", warn: "text-yellow-400",
  }[level] ?? "text-white/40");

  return (
    <div className="min-h-screen bg-[#03060f] text-slate-300 font-mono select-none overflow-y-auto">

      {/* NAV */}
      <nav className="border-b border-white/5 bg-[#030712]/90 backdrop-blur px-15 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-base font-black italic text-white tracking-tight leading-none">
              <span className="text-WHITE-400">DECISION MAKING</span> : TD<span className="text-WHITE-400"> LEARNING</span>
            </h1>
          </div>
          <div className="flex gap-1.5">
            {Object.keys(MODALS).map(btn => (
              <button key={btn} onClick={() => setActiveTab(btn)}
                className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest border border-white/8 bg-white/3 hover:bg-cyan-500/20 hover:border-cyan-500/40 hover:text-cyan-300 transition-all rounded-sm">
                {btn}
              </button>
            ))}
          </div>
        </div>
      </nav>
      <main className="p-4 grid grid-cols-12 gap-4 min-h-[calc(100vh-57px)]">
        <div className="col-span-3 flex flex-col gap-3 overflow-y-auto">
          <Panel title="Topology" accent="cyan">
                    <div className="mb-1 flex justify-between text-[9px] text-white/40 uppercase tracking-widest">
           <span>Router Count</span><span className="text-amber-300 font-bold">{numRouters}</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <button key={n} onClick={() => handleNumRouters(n)}
                  className={`w-9 h-9 rounded border text-[11px] font-black transition-all ${
                    numRouters === n
                      ? 'bg-purple-500/30 border-cyan-400/60 text-cyan-200'
                      : 'bg-white/3 border-white/8 text-white/30 hover:border-amber-400/30 hover:text-amber-400/60'
                  }`}>
                  {n}
                </button>
              ))}
            </div>
          </Panel>

          {/* Learning params */}
          <Panel title="Settings" accent="cyan">
            <ParamRow label="Alpha α" value={alpha.toFixed(1)}>
              <input type="range" min="0.1" max="1" step="0.1" value={alpha}
                onChange={e => setAlpha(parseFloat(e.target.value))}
                className="w-full accent-purple-500 h-1" />
            </ParamRow>
            <ParamRow label="Gamma γ" value={gamma.toFixed(1)}>
              <input type="range" min="0.1" max="1" step="0.1" value={gamma}
                onChange={e => setGamma(parseFloat(e.target.value))}
                className="w-full accent-purple-500 h-1" />
            </ParamRow>
            <ParamRow label="Packet Size" value={`${packetSize}B`}>
              <input type="range" min="64" max="4096" step="64" value={packetSize}
                onChange={e => setPacketSize(parseInt(e.target.value))}
                className="w-full accent-purple-500 h-1" />
            </ParamRow>
          </Panel>

          {/* Reward */}
          <Panel title="Reward Configurations" accent="cyan">
            <ParamRow label="Normal Reward" value={reward}>
              <input type="number" value={reward} onChange={e => setReward(parseFloat(e.target.value))}
                className="w-full bg-black/40 border border-white/8 px-2 py-1.5 rounded text-purple-300 text-[10px] font-bold" />
            </ParamRow>
            <ParamRow label="Congestion Penalty" value={congestionCost}>
              <input type="number" value={congestionCost} onChange={e => setCongestionCost(parseFloat(e.target.value))}
                className="w-full bg-black/40 border border-white/8 px-2 py-1.5 rounded text-white-400 text-[10px] font-bold" />
            </ParamRow>
          </Panel>

          {/* Step mode */}
          <Panel title="Display Mode" accent="cyan">
            <label className="flex items-center gap-3 cursor-pointer" onClick={() => setStepMode(p => !p)}>
              <div className={`w-9 h-5 rounded-full relative transition-all ${stepMode ? 'bg-blue-500' : 'bg-white/10'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${stepMode ? 'left-4' : 'left-0.5'}`} />
              </div>
              <span className="text-[10px] text-white/50">Step by step mode</span>
            </label>
          </Panel>

          <button onClick={resetSim}
            className="w-full py-2 border border-red-500/20 bg-purple-700/10 hover:bg-red-900/30 text-red-400 text-[9px] font-bold uppercase tracking-widest rounded transition-all">
            Reset Simulation
          </button>
        </div>

        {/* CENTER — bigger */}
        <div className="col-span-6 flex flex-col gap-3">
          <div className="flex-1 bg-[#010409] border border-white/5 rounded-xl overflow-hidden">
            <NetworkGraph
              onUpdate={updateHistory}
              alpha={alpha} gamma={gamma}
              congestion={congestion} setCongestion={setCongestion}
              packetSize={packetSize} reward={reward} congestionCost={congestionCost}
              numRouters={numRouters}
              onSimStart={() => {}} onSimEnd={() => {}}
            />
          </div>

          {/* Step breakdown */}
          {stepMode && stepData && (
            <div className="bg-[#030c1b] border border-amber-500/20 rounded-lg p-4 text-[10px] shrink-0">
              <h4 className="text-cyan-400 font-bold uppercase tracking-widest mb-3 text-[9px]">TD Calculation Breakdown</h4>
              <div className="grid grid-cols-4 gap-2 mb-3">
                <CalcBox label="Old V(s)" value={stepData.oldValue?.toFixed(3)} color="text-white/60" />
                <CalcBox label="Reward R" value={stepData.reward} color="text-red-400" />
                <CalcBox label="V(s')" value={stepData.nextValue?.toFixed(3)} color="text-blue-400" />
                <CalcBox label="TD Error" value={stepData.tdError?.toFixed(4)} color="text-yellow-300" />
              </div>
              <div className="bg-black/40 rounded p-3 text-[9px] leading-6 font-mono">
                <p className="text-white/30">TD_Error = R + γ·V(s') − V(s) = {stepData.reward} + ({gamma}×{stepData.nextValue?.toFixed(3)}) − {stepData.oldValue?.toFixed(3)} = <span className="text-cyan-300">{stepData.tdError?.toFixed(4)}</span></p>
                <p className="text-white/30">New V(s) = V(s) + α·TD_Error = {stepData.oldValue?.toFixed(3)} + ({alpha}×{stepData.tdError?.toFixed(4)}) = <span className="text-green-300 font-bold">{stepData.newValue?.toFixed(4)}</span></p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="col-span-3 flex flex-col gap-3 overflow-hidden">
          <Panel title="Log" accent="cyan" className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="overflow-y-auto flex-1 space-y-0.5 text-[8.5px]">
              {logs.map((log, i) => (
                <div key={i} className={`${logColor(log.level)} leading-relaxed ${i > 0 ? 'opacity-40' : ''}`}>{log.text}</div>
              ))}
            </div>
          </Panel>

          <Panel title="Value V(s)" accent="cyan">
            <div className="text-[8px] text-white/30 mb-1 flex justify-between">
              <span>Steps: {history.length}</span>
              <span>Last: {history.at(-1)?.value ?? '—'}</span>
            </div>
            <ResponsiveContainer width="100%" height={95}>
              <AreaChart data={history} margin={{ top: 2, right: 0, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#ffffff05" />
                <XAxis dataKey="step" tick={{ fill: '#ffffff20', fontSize: 7 }} />
                <YAxis tick={{ fill: '#ffffff20', fontSize: 7 }} />
                <Tooltip contentStyle={{ background: '#030712', border: '1px solid #a855f730', fontSize: 9 }} />
                <Area type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={1.5} fill="url(#vg)" name="V(s)" />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="TD Error" accent="cyan">
            <ResponsiveContainer width="100%" height={85}>
              <AreaChart data={history} margin={{ top: 2, right: 0, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#ffffff05" />
                <XAxis dataKey="step" tick={{ fill: '#ffffff20', fontSize: 7 }} />
                <YAxis tick={{ fill: '#ffffff20', fontSize: 7 }} />
                <Tooltip contentStyle={{ background: '#030712', border: '1px solid #06b6d430', fontSize: 9 }} />
                <Area type="monotone" dataKey="tdError" stroke="#a855f7" strokeWidth={1.5} fill="url(#eg)" name="TD Error" />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      </main>

      {/* MODALS */}
      {activeTab === 'learn' && (
        <Modal onClose={() => setActiveTab(null)} title="TD Learning — Concept Explained" accent="cyan">
          <div className="grid grid-cols-2 gap-8 text-[11px] leading-relaxed text-slate-400">
            <div className="space-y-4">
              <section>
                <h3 className="text-cyan-300 font-bold uppercase text-[9px] tracking-widest mb-2">Definition</h3>
                <p>Temporal Difference (TD) Learning is a reinforcement learning method that learns by bootstrapping — updating value estimates from other estimates without waiting for a final outcome.</p>
              </section>
              <section>
                <h3 className="text-cyan-300 font-bold uppercase text-[9px] tracking-widest mb-2">Formula</h3>
                <div className="bg-black/50 p-3 rounded border border-white/5 font-mono text-[10px] text-purple-200 space-y-1">
                  <p>V(s) ← V(s) + α[R + γ·V(s') − V(s)]</p>
                  <p className="text-white/30 text-[9px] pt-1">α=learning rate · γ=discount · R=reward · V(s')=next value</p>
                </div>
              </section>
              <section>
                <h3 className="text-cyan-300 font-bold uppercase text-[9px] tracking-widest mb-2">Example</h3>
                <div className="bg-black/50 p-3 rounded border border-white/5 font-mono text-[9px] space-y-1">
                  <p className="text-white/40">V(s)=0, R=−1, V(s')=10, α=0.5, γ=0.8</p>
                  <p>TD = −1 + (0.8×10) − 0 = <span className="text-yellow-300">7.0</span></p>
                  <p>New V = 0 + (0.5×7.0) = <span className="text-green-300">3.5</span></p>
                </div>
              </section>
              <section>
                <h3 className="text-cyan-300 font-bold uppercase text-[9px] tracking-widest mb-2">Real world Uses</h3>
                <ul className="list-disc list-inside text-[10px] text-white/40 space-y-1">
                  <li>Adaptive network routing</li>
                  <li>Game AI — TD-Gammon, AlphaGo</li>
                  <li>Robotics locomotion control</li>
                  <li>Finance portfolio optimization</li>
                </ul>
              </section>
            </div>
            <div className="space-y-4">
              <section>
                <h3 className="text-cyan-300 font-bold uppercase text-[9px] tracking-widest mb-2">Parameters</h3>
                <div className="space-y-2">
                  {[['α Alpha','Fast α = quick but noisy updates. Slow α = stable, gradual.'],
                    ['γ Gamma','Near 1 = values future rewards heavily. Near 0 = greedy.'],
                    ['TD Error','The surprise signal: how wrong our last prediction was.'],
                    ['V(s)','Expected total reward from state s under current policy.']
                  ].map(([k,v]) => (
                    <div key={k} className="bg-black/30 rounded p-2 border border-white/5">
                      <p className="text-purple-300 font-bold text-[10px]">{k}</p>
                      <p className="text-white/40 text-[9px] mt-0.5">{v}</p>
                    </div>
                  ))}
                </div>
              </section>
              <div className="aspect-video rounded-lg overflow-hidden border border-white/10">
                <iframe width="100%" height="100%" src="https://www.youtube.com/embed/0r3Q6yH1MvQ"
                  frameBorder="0" allowFullScreen title="TD Learning" />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {activeTab === 'help' && (
        <Modal onClose={() => setActiveTab(null)} title="How to Use" accent="violet">
          <div className="grid grid-cols-2 gap-6 text-[11px]">
            {[
              ['1. Set Router Count', 'Choose 1–6 routers from the Topology panel.'],
              ['2. Adjust Parameters', 'Adjust α (speed of learning), γ (future discount), packet size, and reward values.'],
              ['3. Toggle Congestion', 'Click any router node directly on the graph, or use the reset button. Congested nodes receive the penalty reward.'],
              ['4. Send Packets', 'Click Send Packet. The agent picks the highest-value path (greedy) and updates V(Source) via TD.'],
              ['5. Step Mode', 'Enable step-by-step mode to see the full TD formula worked out after each packet.'],
              ['6. Charts', 'Right panel shows V(s) converging and TD error shrinking — showing the network has learned.'],
            ].map(([t, d]) => (
              <div key={t} className="bg-black/30 rounded p-3 border border-white/5">
                <p className="text-violet-300 font-bold text-[10px] mb-1">{t}</p>
                <p className="text-white/40 text-[9px] leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {activeTab === 'download' && (
        <Modal onClose={() => setActiveTab(null)} title="References & Further Reading" accent="emerald">
          <div className="space-y-5 text-[11px]">
            <section>
              <h3 className="text-emerald-300 font-bold text-[9px] uppercase tracking-widest mb-3">Prescribed Textbook</h3>
              <div className="bg-black/40 rounded p-4 border border-white/5">
                <p className="text-white font-bold">Reinforcement Learning: An Introduction</p>
                <p className="text-white/50 text-[10px] mt-1">Sutton & Barto — Chapter 6: Temporal-Difference Learning</p>
                <a href="http://incompleteideas.net/book/the-book-2nd.html" target="_blank" rel="noreferrer"
                  className="text-emerald-400 text-[9px] underline mt-2 inline-block hover:text-emerald-300">
                  → incompleteideas.net/book/the-book-2nd.html
                </a>
              </div>
            </section>
            <section>
              <h3 className="text-emerald-300 font-bold text-[9px] uppercase tracking-widest mb-3">Technical Websites</h3>
              <div className="space-y-2">
                {[['OpenAI Spinning Up','https://spinningup.openai.com/en/latest/'],
                  ['Stanford CS234','https://web.stanford.edu/class/cs234/'],
                  ['DeepMind RL Research','https://deepmind.com/research/reinforcement-learning'],
                ].map(([n, u]) => (
                  <div key={n} className="flex justify-between items-center bg-black/30 rounded p-3 border border-white/5">
                    <span className="text-white/60 text-[10px]">{n}</span>
                    <a href={u} target="_blank" rel="noreferrer" className="text-emerald-400 text-[9px] underline">→ Visit</a>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h3 className="text-emerald-300 font-bold text-[9px] uppercase tracking-widest mb-3">Research Papers</h3>
              <div className="space-y-2">
                {[['Sutton (1988) — Learning to Predict by TD Methods','https://link.springer.com/article/10.1007/BF00115009'],
                  ['Tesauro (1995) — TD-Gammon Self-Teaching Backgammon','https://dl.acm.org/doi/10.1145/203330.203343'],
                ].map(([n, u]) => (
                  <div key={n} className="bg-black/30 rounded p-3 border border-white/5">
                    <p className="text-white/60 text-[10px]">{n}</p>
                    <a href={u} target="_blank" rel="noreferrer" className="text-emerald-400 text-[9px] underline mt-1 inline-block">→ {u}</a>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </Modal>
      )}

      {activeTab === 'developed by' && (
        <Modal onClose={() => setActiveTab(null)} title="Developed By" accent="amber">
          <div className="flex flex-col items-center py-6">
            <div className="flex justify-center gap-12 w-full mb-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                  <img src="/harshitha.jpg" alt="Harshitha" className="w-full h-full object-cover" />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold tracking-widest text-[15px] uppercase leading-tight">
                    HARSHITHA SAJITH MENON<br />
                  </p>
                  <p className="text-amber-400/60 font-mono text-[15px] mt-1">24BYB1166 </p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                  <img src="/priyadharshini.jpg" alt="Priyadharshini" className="w-full h-full object-cover" />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold tracking-widest text-[15px] uppercase leading-tight">
                    PRIYADHARSHINI S<br />
                  </p>
                  <p className="text-amber-400/60 font-mono text-[15px] mt-1">24BYB1068</p>
                </div>
              </div>

            </div>

            <div className="pt-6 border-t border-white/5 w-3/4 flex flex-col items-center">
              <p className="text-[12px] text-white/50 uppercase tracking-[0.4em] mb-4">Under the Guidance of</p>
              <div className="w-20 h-20 rounded-full overflow-hidden border border-white/50 mb-3 grayscale hover:grayscale-0 transition-all">
                <img src="/swaminathan.jpg" alt="Faculty" className="w-full h-full object-cover" />
              </div>
              <p className="text-white font-bold tracking-widest text-[15px] uppercase text-center">
                SWAMINATHAN A<br />
              </p>
            </div>

          </div>
        </Modal>
      )}
    </div>
  );
}

function Panel({ title, accent, children, className = "" }) {
  const c = { cyan:'text-cyan-400', purple:'text-purple-400', red:'text-red-400', amber:'text-amber-400', blue:'text-blue-400' };
  return (
    <div className={`bg-[#030c1b] border border-white/5 rounded-lg p-4 ${className}`}>
      <h3 className={`text-[9px] font-bold ${c[accent]??'text-white/40'} uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-2`}>{title}</h3>
      {children}
    </div>
  );
}

function ParamRow({ label, value, children }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between mb-1.5">
        <span className="text-[9px] text-white/40 uppercase tracking-widest">{label}</span>
        <span className="text-[9px] text-white/60 font-bold">{value}</span>
      </div>
      {children}
    </div>
  );
}

function CalcBox({ label, value, color }) {
  return (
    <div className="bg-black/40 rounded p-2 border border-white/5 text-center">
      <p className="text-[8px] text-white/30 uppercase tracking-widest">{label}</p>
      <p className={`${color} font-bold text-sm mt-1`}>{value}</p>
    </div>
  );
}

function Modal({ onClose, title, accent, children }) {
  const border = { cyan:'border-cyan-500/30', violet:'border-violet-500/30', emerald:'border-emerald-500/30', amber:'border-amber-500/30' };
  const col = { cyan:'text-cyan-400', violet:'text-violet-400', emerald:'text-emerald-400', amber:'text-amber-400' };
  return (
    <div className="fixed inset-0 z-50 bg-[#020817]/95 backdrop-blur-md flex items-center justify-center p-8 overflow-y-auto">
      <div className={`max-w-4xl w-full bg-[#030c1b] border ${border[accent]??'border-white/10'} rounded-2xl p-8 relative max-h-[90vh] overflow-y-auto`}>
        <button onClick={onClose} className="absolute top-5 right-6 text-white/30 hover:text-white text-2xl font-black">&times;</button>
        <h2 className="text-lg font-black text-white mb-6 uppercase tracking-tight">
          <span className={col[accent]}>◈</span> {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
