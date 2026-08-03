const $=id=>document.getElementById(id);const D=window.DASHBOARD_DATA;if(!D||!D.series){const e=$("loadError");if(e)e.style.display="block";throw new Error("dashboard-data.js não carregou");}const countries=Object.keys(D.series);countries.forEach(c=>$('country').add(new Option(c,c)));let layoutBase={margin:{l:46,r:20,t:25,b:45},paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{family:'DM Sans',color:'#3b4a42'},hovermode:'x unified',legend:{orientation:'h',y:1.12},xaxis:{gridcolor:'#edf1ee'},yaxis:{gridcolor:'#edf1ee'}};const cfg={responsive:true,displayModeBar:false};function fmtDate(s){return new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{month:'short',year:'numeric'})}function pct(a,b){if(!b)return a?'+∞':'0%';let v=(a/b-1)*100;return `${v>=0?'+':''}${v.toFixed(0)}%`}function filtered(){let c=$('country').value,y=$('year').value,s=$('start').value,e=$('end').value;let hasSpecificPeriod=Boolean(s||e);return D.series[c].filter(r=>(hasSpecificPeriod||y==='all'||r.date.startsWith(y))&&(!s||r.date>=s)&&(!e||r.date<=e))}function peak(rows,key){return rows.reduce((a,b)=>b[key]>a[key]?b:a,rows[0]||{[key]:0,date:''})}function updateKPIs(){
  const c=$('country').value;
  const curr=D.kpi2026[c];
  const prev=D.kpi2025[c];
  const rows2026=D.series[c].filter(r=>r.date.startsWith('2026'));
  const b=curr[0],cr=curr[1];

  $('kBond').textContent=Math.round(b);
  $('kCristo').textContent=Math.round(cr);
  $('vBond').textContent=`${pct(curr[0],prev[0])} vs. mesmo período de 2025`;
  $('vCristo').textContent=`${pct(curr[1],prev[1])} vs. mesmo período de 2025`;
  $('vBond').style.color=curr[0]>=prev[0]?'#23845a':'#b94d3b';
  $('vCristo').style.color=curr[1]>=prev[1]?'#23845a':'#b94d3b';

  const pb=peak(rows2026,'bondinho'),pc=peak(rows2026,'cristo');
  $('pBond').textContent=pb.bondinho;
  $('pdBond').textContent=pb.date?fmtDate(pb.date):'—';
  $('pCristo').textContent=pc.cristo;
  $('pdCristo').textContent=pc.date?fmtDate(pc.date):'—';
  $('strength').textContent=cr?`${Math.round(b/cr*100)}%`:'—';
  $('overviewInsight').innerHTML=`Em <strong>${c}</strong>, no acumulado atual de 2026, o Bondinho representa aproximadamente <strong>${Math.round(b/cr*100)}%</strong> do interesse do Cristo. Os KPIs acima permanecem fixos no acumulado de 2026 e não mudam com os filtros de ano ou data.`;
}
function timeline(){
  const r=filtered();
  const dates=r.map(x=>x.date);
  const bond=r.map(x=>Number(x.bondinho));
  const cristo=r.map(x=>Number(x.cristo));
  const gap=r.map((x,i)=>cristo[i]-bond[i]);
  const ratio=r.map((x,i)=>cristo[i]?bond[i]/cristo[i]*100:null);
  const bondHover=r.map(x=>String(x.date).startsWith('2026-02')?'Pico de fevereiro de 2026: associado à repercussão de uma questão sobre o Bondinho no programa Quem Quer Ser um Milionário.':'');
  const custom=r.map((x,i)=>[gap[i],ratio[i],bondHover[i]]);

  Plotly.react('timeline',[
    {
      x:dates,y:cristo,name:'Cristo',mode:'lines+markers',
      line:{color:'#103f32',width:3},
      customdata:custom,
      hovertemplate:'%{x|%b/%Y}<br>Cristo: %{y}<br>Diferença para o Bondinho: %{customdata[0]:.0f} pontos<extra>Cristo</extra>'
    },
    {
      x:dates,y:bond,name:'Bondinho',mode:'lines+markers',
      line:{color:'#bc6b34',width:3},
      fill:'tonexty',fillcolor:'rgba(188,107,52,0.14)',
      customdata:custom,
      hovertemplate:'%{x|%b/%Y}<br>Bondinho: %{y}<br>Bondinho equivale a %{customdata[1]:.0f}% do Cristo<br>%{customdata[2]}<extra>Bondinho</extra>'
    }
  ],{
    ...layoutBase,
    yaxis:{...layoutBase.yaxis,title:'Índice de interesse'},
    annotations:r.length?[{
      xref:'paper',yref:'paper',x:1,y:1.12,showarrow:false,
      text:`Diferença média: ${Math.round(gap.reduce((a,b)=>a+b,0)/gap.length)} pontos`,
      font:{size:12,color:'#6b756f'},bgcolor:'rgba(255,255,255,.8)',borderpad:4
    }]:[]
  },cfg)
}
function yoy(){
  const c=$('country').value;
  const topic=$('yoyTopic')?.value||'Ambos';
  const rows=Array.isArray(D.series[c])?D.series[c]:[];
  const months=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  function monthly(year,key){
    const values=Array(12).fill(null);
    rows.forEach(row=>{
      const parts=String(row.date||'').split('-');
      const rowYear=Number(parts[0]);
      const month=Number(parts[1])-1;
      const value=Number(row[key]);
      if(rowYear===year && month>=0 && month<12 && Number.isFinite(value)) values[month]=value;
    });
    return values;
  }

  const traces=[];
  const addTrace=(key,label,year,color,dash)=>{
    traces.push({
      x:months,
      y:monthly(year,key),
      name:`${label} ${year}`,
      type:'scatter',
      mode:'lines+markers',
      connectgaps:false,
      line:{color,width:3,dash},
      marker:{color,size:7},
      hovertemplate:`%{x}/${year}<br>${label}: %{y}<extra></extra>`
    });
  };

  if(topic==='Bondinho'||topic==='Ambos'){
    addTrace('bondinho','Bondinho',2025,'#bc6b34','dot');
    addTrace('bondinho','Bondinho',2026,'#bc6b34','solid');
  }
  if(topic==='Cristo'||topic==='Ambos'){
    addTrace('cristo','Cristo',2025,'#103f32','dot');
    addTrace('cristo','Cristo',2026,'#103f32','solid');
  }

  Plotly.react('yoy',traces,{
    ...layoutBase,
    xaxis:{gridcolor:'#edf1ee',title:'',categoryorder:'array',categoryarray:months},
    yaxis:{...layoutBase.yaxis,title:'Índice de interesse',rangemode:'tozero'},
    legend:{orientation:'h',y:1.16,x:0},
    margin:{...layoutBase.margin,t:52},
    hovermode:'x unified'
  },cfg);
}

function season(){
  const c=$('country').value;
  const rows=Array.isArray(D.series[c])?D.series[c]:[];
  const labels=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const names=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const sums={bondinho:Array(12).fill(0),cristo:Array(12).fill(0)};
  const counts={bondinho:Array(12).fill(0),cristo:Array(12).fill(0)};

  rows.forEach(row=>{
    const parts=String(row.date||'').split('-');
    const month=Number(parts[1])-1;
    if(month<0||month>11)return;
    ['bondinho','cristo'].forEach(key=>{
      const value=Number(row[key]);
      if(Number.isFinite(value)){
        sums[key][month]+=value;
        counts[key][month]+=1;
      }
    });
  });

  const average=key=>sums[key].map((total,i)=>counts[key][i]?total/counts[key][i]:null);
  const bondinho=average('bondinho');
  const cristo=average('cristo');

  Plotly.react('season',[
    {x:labels,y:bondinho,name:'Bondinho',type:'bar',marker:{color:'#bc6b34'},hovertemplate:'%{x}: %{y:.1f}<extra>Bondinho</extra>'},
    {x:labels,y:cristo,name:'Cristo',type:'bar',marker:{color:'#103f32'},hovertemplate:'%{x}: %{y:.1f}<extra>Cristo</extra>'}
  ],{
    ...layoutBase,
    barmode:'group',
    hovermode:'x unified',
    xaxis:{gridcolor:'#edf1ee',categoryorder:'array',categoryarray:labels},
    yaxis:{gridcolor:'#edf1ee',title:'Média do índice de interesse',rangemode:'tozero'}
  },cfg);

  const validBond=bondinho.map((v,i)=>({v,i})).filter(x=>Number.isFinite(x.v));
  const validCristo=cristo.map((v,i)=>({v,i})).filter(x=>Number.isFinite(x.v));
  const maxBond=validBond.reduce((a,b)=>b.v>a.v?b:a,{v:0,i:0});
  const maxCristo=validCristo.reduce((a,b)=>b.v>a.v?b:a,{v:0,i:0});
  $('seasonText').innerHTML=`<div class="big">${names[maxBond.i]}</div><p>É o mês historicamente mais forte para o <strong>Bondinho</strong> em ${c}, com média de ${maxBond.v.toFixed(1)} pontos.</p><div class="big">${names[maxCristo.i]}</div><p>É o principal mês para o <strong>Cristo</strong>, com média de ${maxCristo.v.toFixed(1)} pontos.</p>`;
}
function map(){let t=$('mapTopic').value,data=D.geo[t].slice().sort((a,b)=>b.value-a.value);Plotly.react('map',[{type:'choropleth',locations:data.map(x=>x.iso),z:data.map(x=>x.value),text:data.map(x=>x.country),colorscale:t==='Bondinho'?[[0,'#edf4ef'],[1,'#bc6b34']]:[[0,'#edf4ef'],[1,'#103f32']],marker:{line:{color:'white',width:.5}},colorbar:{title:'Interesse'}}],{margin:{l:0,r:0,t:0,b:0},geo:{projection:{type:'natural earth'},showframe:false,showcoastlines:false,bgcolor:'rgba(0,0,0,0)'}},cfg);$('ranking').innerHTML=data.slice(0,15).map((x,i)=>`<div class="rank-row"><b>${i+1}</b><span>${x.country}</span><strong>${x.value}</strong></div>`).join('')}
function terms(){let c=$('country').value,items=D.related[c];$('termList').innerHTML=items.map(x=>`<span class="chip">${x.term}</span>`).join('');$('relatedTable').innerHTML=items.slice(0,7).map(x=>`<div class="row"><span>${x.term}</span><span class="tag">${x.category}</span></div>`).join('');let canvas=$('wordcloud');canvas.width=canvas.offsetWidth*2;canvas.height=320*2;WordCloud(canvas,{list:items.map((x,i)=>[x.term,28-i*2]),gridSize:18,weightFactor:2.2,fontFamily:'DM Sans',color:()=>['#103f32','#bc6b34','#65776d'][Math.floor(Math.random()*3)],backgroundColor:'#f7f8f6',rotateRatio:.15})}
function safeRun(name,fn){try{fn()}catch(err){console.error(name,err)}}function update(){safeRun('KPIs',updateKPIs);if(window.Plotly){safeRun('Linha do tempo',timeline);safeRun('Comparação anual',yoy);safeRun('Sazonalidade',season)}else{console.error('Plotly não carregou')}if(window.WordCloud){safeRun('Termos',terms)}}countries.forEach(()=>{});$('country').value='Mundo';$('start').value='';$('end').value='';['country','year','start','end'].forEach(id=>$(id).addEventListener('change',update));$('mapTopic').addEventListener('change',()=>safeRun('Mapa',map));$('yoyTopic').addEventListener('change',()=>safeRun('Comparação anual',yoy));$('reset').onclick=()=>{$('country').value='Mundo';$('year').value='2026';$('start').value='';$('end').value='';update()};window.addEventListener('resize',()=>window.WordCloud&&setTimeout(()=>safeRun('Termos',terms),150));update();if(window.Plotly)safeRun('Mapa',map);
