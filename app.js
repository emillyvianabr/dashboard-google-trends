
const $ = id => document.getElementById(id);
const D = window.DASHBOARD_DATA;
if (!D || !D.series) {
  const e = $("loadError");
  if (e) e.style.display = "block";
  throw new Error("dashboard-data.js não carregou");
}

const countries = Object.keys(D.series);
countries.forEach(c => $('country').add(new Option(c, c)));

const layoutBase = {
  margin: {l: 46, r: 20, t: 25, b: 45},
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: {family: 'DM Sans', color: '#3b4a42'},
  hovermode: 'x unified',
  legend: {orientation: 'h', y: 1.12},
  xaxis: {gridcolor: '#edf1ee'},
  yaxis: {gridcolor: '#edf1ee'}
};
const cfg = {responsive: true, displayModeBar: false};
const monthShort = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const trackedCountries = ['Brasil','Argentina','Chile','Colômbia','Uruguai','França','Estados Unidos'];

function fmtDate(s){ return new Date(s + 'T12:00:00').toLocaleDateString('pt-BR',{month:'short',year:'numeric'}); }
function pct(a,b){
  if (b === 0 || b === null || b === undefined) return a ? '+∞%' : '0%';
  const v = (a / b - 1) * 100;
  return `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`;
}
function avg(arr){
  const vals = (arr || []).filter(v => v !== null && v !== undefined && Number.isFinite(Number(v))).map(Number);
  return vals.length ? vals.reduce((a,b)=>a+b,0) / vals.length : null;
}
function avgSamePeriod(y2025, y2026){
  const indices = [];
  (y2026 || []).forEach((v,i)=>{ if (v !== null && v !== undefined && Number.isFinite(Number(v))) indices.push(i); });
  const vals = indices.map(i => Number(y2025?.[i])).filter(v => Number.isFinite(v));
  return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null;
}
function filtered(){
  const c = $('country').value, y = $('year').value, s = $('start').value, e = $('end').value;
  const hasSpecificPeriod = Boolean(s || e);
  return D.series[c].filter(r => (hasSpecificPeriod || y === 'all' || r.date.startsWith(y)) && (!s || r.date >= s) && (!e || r.date <= e));
}
function peak(rows,key){ return rows.reduce((a,b)=>b[key] > a[key] ? b : a, rows[0] || {[key]:0,date:''}); }

function updateKPIs(){
  const c = $('country').value;
  const curr = D.kpi2026[c];
  const prev = D.kpi2025[c];
  const rows2026 = D.series[c].filter(r => r.date.startsWith('2026'));
  const b = curr[0], cr = curr[1];

  if($('kBond')){
    $('kBond').textContent = Math.round(b);
    $('kCristo').textContent = Math.round(cr);
    $('vBond').textContent = `${pct(curr[0], prev[0])} vs. mesmo período de 2025`;
    $('vCristo').textContent = `${pct(curr[1], prev[1])} vs. mesmo período de 2025`;
    $('vBond').style.color = curr[0] >= prev[0] ? '#23845a' : '#b94d3b';
    $('vCristo').style.color = curr[1] >= prev[1] ? '#23845a' : '#b94d3b';

    const pb = peak(rows2026,'bondinho'), pc = peak(rows2026,'cristo');
    $('pBond').textContent = pb.bondinho;
    $('pdBond').textContent = pb.date ? fmtDate(pb.date) : '—';
    $('pCristo').textContent = pc.cristo;
    $('pdCristo').textContent = pc.date ? fmtDate(pc.date) : '—';
    $('strength').textContent = cr ? `${Math.round(b/cr*100)}%` : '—';
  }

  if($('overviewInsight')){
    $('overviewInsight').innerHTML = `Em <strong>${c}</strong>, no acumulado atual de 2026, o Bondinho representa aproximadamente <strong>${Math.round(b/cr*100)}%</strong> do interesse do Cristo. A primeira parte do painel aprofunda o comportamento do Bondinho; a segunda coloca esse desempenho em perspectiva frente ao Cristo.`;
  }
}

function updateBondKpi(){
  const c = $('country').value;
  const data = D.bondinhoMonthlyYoY?.[c] || {};
  const y2025 = data['2025'] || [];
  const y2026 = data['2026'] || [];
  const a2026 = avg(y2026);
  const a2025 = avgSamePeriod(y2025, y2026);
  $('bondKpiCountry').textContent = c;
  $('bondAvgKpi').textContent = a2026 !== null ? a2026.toFixed(1) : '—';
  $('bondAvg2025').textContent = a2025 !== null ? a2025.toFixed(1) : '—';
  $('bondAvg2026').textContent = a2026 !== null ? a2026.toFixed(1) : '—';
  const change = a2025 !== null && a2026 !== null ? (a2026 / a2025 - 1) * 100 : null;
  if (change === null || !Number.isFinite(change)) {
    $('bondAvgVar').textContent = 'Sem base comparável em 2025';
    $('bondAvgVar').className = '';
  } else {
    $('bondAvgVar').textContent = `${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(0)}% vs. jan–jul de 2025`;
    $('bondAvgVar').className = change >= 0 ? 'up' : 'down';
  }
}

function timeline(){
  const r = filtered();
  const dates = r.map(x=>x.date);
  const bond = r.map(x=>Number(x.bondinho));
  const cristo = r.map(x=>Number(x.cristo));
  const gap = r.map((x,i)=>cristo[i]-bond[i]);
  const ratio = r.map((x,i)=>cristo[i]?bond[i]/cristo[i]*100:null);
  const bondHover = r.map(x=>String(x.date).startsWith('2026-02') ? 'Pico de fevereiro de 2026: associado à repercussão de uma questão sobre o Bondinho no programa Quem Quer Ser um Milionário.' : '');
  const custom = r.map((x,i)=>[gap[i],ratio[i],bondHover[i]]);

  Plotly.react('timeline',[
    {x:dates,y:cristo,name:'Cristo',mode:'lines+markers',line:{color:'#103f32',width:3},customdata:custom,hovertemplate:'%{x|%b/%Y}<br>Cristo: %{y}<br>Diferença para o Bondinho: %{customdata[0]:.0f} pontos<extra>Cristo</extra>'},
    {x:dates,y:bond,name:'Bondinho',mode:'lines+markers',line:{color:'#bc6b34',width:3},fill:'tonexty',fillcolor:'rgba(188,107,52,0.14)',customdata:custom,hovertemplate:'%{x|%b/%Y}<br>Bondinho: %{y}<br>Bondinho equivale a %{customdata[1]:.0f}% do Cristo<br>%{customdata[2]}<extra>Bondinho</extra>'}
  ],{
    ...layoutBase,
    yaxis:{...layoutBase.yaxis,title:'Índice de interesse'},
    annotations:r.length?[{xref:'paper',yref:'paper',x:1,y:1.12,showarrow:false,text:`Diferença média: ${Math.round(gap.reduce((a,b)=>a+b,0)/gap.length)} pontos`,font:{size:12,color:'#6b756f'},bgcolor:'rgba(255,255,255,.8)',borderpad:4}]:[]
  },cfg);
}

function bondinhoYoy(){
  const c = $('country').value;
  const data = D.bondinhoMonthlyYoY?.[c];
  if(!data) return;
  const y2025 = data['2025'] || [];
  const y2026 = data['2026'] || [];
  Plotly.react('bondinhoYoy',[
    {x:monthShort,y:y2025,name:'2025',type:'scatter',mode:'lines+markers',connectgaps:false,line:{color:'#bc6b34',width:3,dash:'dot'},marker:{color:'#bc6b34',size:7},hovertemplate:'%{x}/2025<br>Interesse: %{y:.1f}<extra></extra>'},
    {x:monthShort,y:y2026,name:'2026',type:'scatter',mode:'lines+markers',connectgaps:false,line:{color:'#103f32',width:4,dash:'solid'},marker:{color:'#103f32',size:8},hovertemplate:'%{x}/2026<br>Interesse: %{y:.1f}<extra></extra>'}
  ],{
    ...layoutBase,
    xaxis:{gridcolor:'#edf1ee',categoryorder:'array',categoryarray:monthShort},
    yaxis:{...layoutBase.yaxis,title:'Índice de interesse',rangemode:'tozero'},
    legend:{orientation:'h',y:1.12,x:0},
    hovermode:'x unified',
    annotations:[{xref:'paper',yref:'paper',x:1,y:1.12,showarrow:false,text:`${c} • termo: Pão de Açúcar`,font:{size:12,color:'#6b756f'},bgcolor:'rgba(255,255,255,.8)',borderpad:4}]
  },cfg);
}

function bondSeason(){
  const c = $('country').value;
  const data = D.bondinhoMonthlyYoY?.[c];
  if(!data) return;
  const y2025 = data['2025'] || [];
  const y2026 = data['2026'] || [];
  const seasonal = monthShort.map((m,i)=>{
    const vals = [y2025[i], y2026[i]].filter(v => v !== null && v !== undefined && Number.isFinite(Number(v))).map(Number);
    return vals.length ? vals.reduce((a,b)=>a+b,0) / vals.length : null;
  });
  Plotly.react('bondSeason',[
    {x:monthShort,y:seasonal,name:'Média 2025-2026',type:'bar',marker:{color:'#bc6b34'},hovertemplate:'%{x}<br>Média sazonal: %{y:.1f}<extra></extra>'}
  ],{
    ...layoutBase,
    xaxis:{gridcolor:'#edf1ee',categoryorder:'array',categoryarray:monthShort},
    yaxis:{gridcolor:'#edf1ee',title:'Média do índice de interesse',rangemode:'tozero'},
    showlegend:false
  },cfg);
}

function bondCountryStrength(){
  const rows = trackedCountries.map(country => {
    const data = D.bondinhoMonthlyYoY?.[country] || {};
    const y2026 = avg(data['2026'] || []);
    const y2025 = avgSamePeriod(data['2025'] || [], data['2026'] || []);
    const change = (y2026 !== null && y2025 !== null && y2025 !== 0) ? ((y2026/y2025)-1)*100 : null;
    return {country, y2026, y2025, change};
  }).filter(x => x.y2026 !== null).sort((a,b)=>a.y2026-b.y2026);

  Plotly.react('bondCountryStrength',[
    {
      x: rows.map(r=>r.y2026),
      y: rows.map(r=>r.country),
      type:'bar', orientation:'h',
      marker:{color:'#103f32'},
      customdata: rows.map(r=>[r.y2025, r.change]),
      hovertemplate:'%{y}<br>Média jan–jul 2026: %{x:.1f}<br>Média jan–jul 2025: %{customdata[0]:.1f}<br>Variação: %{customdata[1]:.0f}%<extra></extra>'
    }
  ],{
    ...layoutBase,
    margin:{l:120,r:20,t:25,b:45},
    xaxis:{gridcolor:'#edf1ee',title:'Média mensal de interesse (jan–jul 2026)',rangemode:'tozero'},
    yaxis:{gridcolor:'#edf1ee',automargin:true},
    showlegend:false
  },cfg);
}

function bondMap(){
  const data = (D.bondinhoGeoCurrent || D.geo?.Bondinho || []).slice().sort((a,b)=>b.value-a.value);
  Plotly.react('bondMap',[
    {
      type:'choropleth',
      locations:data.map(x=>x.iso),
      z:data.map(x=>x.value),
      text:data.map(x=>x.country),
      colorscale:[[0,'#edf4ef'],[1,'#bc6b34']],
      marker:{line:{color:'white',width:.5}},
      colorbar:{title:'Interesse'}
    }
  ],{
    margin:{l:0,r:0,t:0,b:0},
    geo:{projection:{type:'natural earth'},showframe:false,showcoastlines:false,bgcolor:'rgba(0,0,0,0)'}
  },cfg);
  $('bondMapRanking').innerHTML = data.slice(0,20).map((x,i)=>`<div class="rank-row"><b>${i+1}</b><span>${x.country}</span><strong>${x.value}</strong></div>`).join('');
}

function yoy(){
  const c = $('country').value;
  const topic = $('yoyTopic')?.value || 'Ambos';
  const rows = Array.isArray(D.series[c]) ? D.series[c] : [];
  function monthly(year,key){
    const values = Array(12).fill(null);
    rows.forEach(row=>{
      const parts = String(row.date || '').split('-');
      const rowYear = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const value = Number(row[key]);
      if(rowYear === year && month >= 0 && month < 12 && Number.isFinite(value)) values[month] = value;
    });
    return values;
  }
  const traces = [];
  const addTrace = (key,label,year,color,dash)=>{
    traces.push({x:monthShort,y:monthly(year,key),name:`${label} ${year}`,type:'scatter',mode:'lines+markers',connectgaps:false,line:{color,width:3,dash},marker:{color,size:7},hovertemplate:`%{x}/${year}<br>${label}: %{y}<extra></extra>`});
  };
  if(topic === 'Bondinho' || topic === 'Ambos'){
    addTrace('bondinho','Bondinho',2025,'#bc6b34','dot');
    addTrace('bondinho','Bondinho',2026,'#bc6b34','solid');
  }
  if(topic === 'Cristo' || topic === 'Ambos'){
    addTrace('cristo','Cristo',2025,'#103f32','dot');
    addTrace('cristo','Cristo',2026,'#103f32','solid');
  }
  Plotly.react('yoy',traces,{
    ...layoutBase,
    xaxis:{gridcolor:'#edf1ee',title:'',categoryorder:'array',categoryarray:monthShort},
    yaxis:{...layoutBase.yaxis,title:'Índice de interesse',rangemode:'tozero'},
    legend:{orientation:'h',y:1.16,x:0},
    margin:{...layoutBase.margin,t:52},
    hovermode:'x unified'
  },cfg);
}

function terms(){
  const c = $('country').value, items = D.related[c];
  $('termList').innerHTML = items.map(x=>`<span class="chip">${x.term}</span>`).join('');
  $('relatedTable').innerHTML = items.slice(0,7).map(x=>`<div class="row"><span>${x.term}</span><span class="tag">${x.category}</span></div>`).join('');
  const canvas = $('wordcloud');
  canvas.width = canvas.offsetWidth * 2;
  canvas.height = 320 * 2;
  WordCloud(canvas,{list:items.map((x,i)=>[x.term,28-i*2]),gridSize:18,weightFactor:2.2,fontFamily:'DM Sans',color:()=>['#103f32','#bc6b34','#65776d'][Math.floor(Math.random()*3)],backgroundColor:'#f7f8f6',rotateRatio:.15});
}

function safeRun(name, fn){ try { fn(); } catch(err) { console.error(name, err); } }
function update(){
  safeRun('KPIs gerais', updateKPIs);
  safeRun('KPI Bondinho', updateBondKpi);
  if(window.Plotly){
    safeRun('Bondinho YoY', bondinhoYoy);
    safeRun('Sazonalidade Bondinho', bondSeason);
    safeRun('Força por país', bondCountryStrength);
    safeRun('Mapa Bondinho', bondMap);
    safeRun('Linha do tempo', timeline);
    safeRun('Comparação anual', yoy);
  } else {
    console.error('Plotly não carregou');
  }
  if(window.WordCloud) safeRun('Termos', terms);
}

$('country').value = 'Mundo';
$('start').value = '';
['country','year','start','end'].forEach(id => $(id).addEventListener('change', update));
$('yoyTopic').addEventListener('change', ()=>safeRun('Comparação anual', yoy));
$('reset').onclick = ()=>{ $('country').value='Mundo'; $('year').value='2026'; $('start').value=''; $('end').value=''; update(); };
window.addEventListener('resize', ()=>window.WordCloud && setTimeout(()=>safeRun('Termos', terms),150));
update();
