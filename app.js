const $=id=>document.getElementById(id);const D=window.DASHBOARD_DATA;if(!D||!D.series){const e=$("loadError");if(e)e.style.display="block";throw new Error("dashboard-data.js não carregou");}const countries=Object.keys(D.series);countries.forEach(c=>$('country').add(new Option(c,c)));let layoutBase={margin:{l:46,r:20,t:25,b:45},paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{family:'DM Sans',color:'#3b4a42'},hovermode:'x unified',legend:{orientation:'h',y:1.12},xaxis:{gridcolor:'#edf1ee'},yaxis:{gridcolor:'#edf1ee'}};const cfg={responsive:true,displayModeBar:false};function fmtDate(s){return new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{month:'short',year:'numeric'})}function pct(a,b){if(!b)return a?'+∞':'0%';let v=(a/b-1)*100;return `${v>=0?'+':''}${v.toFixed(0)}%`}function filtered(){let c=$('country').value,y=$('year').value,s=$('start').value,e=$('end').value;let hasSpecificPeriod=Boolean(s||e);return D.series[c].filter(r=>(hasSpecificPeriod||y==='all'||r.date.startsWith(y))&&(!s||r.date>=s)&&(!e||r.date<=e))}function peak(rows,key){return rows.reduce((a,b)=>b[key]>a[key]?b:a,rows[0]||{[key]:0,date:''})}function updateKPIs(){let c=$('country').value,year=$('year').value;let official=year==='2026'?D.kpi2026[c]:year==='2025'?D.kpi2025[c]:null;let rows=filtered();let b=official?official[0]:rows.reduce((s,r)=>s+r.bondinho,0)/(rows.length||1);let cr=official?official[1]:rows.reduce((s,r)=>s+r.cristo,0)/(rows.length||1);$('kBond').textContent=Math.round(b);$('kCristo').textContent=Math.round(cr);let prev=D.kpi2025[c],curr=D.kpi2026[c];$('vBond').textContent=year==='2026'?`${pct(curr[0],prev[0])} vs. 2025`:'média do período';$('vCristo').textContent=year==='2026'?`${pct(curr[1],prev[1])} vs. 2025`:'média do período';$('vBond').style.color=year==='2026'&&curr[0]>=prev[0]?'#23845a':'#b94d3b';$('vCristo').style.color=year==='2026'&&curr[1]>=prev[1]?'#23845a':'#b94d3b';let pb=peak(rows,'bondinho'),pc=peak(rows,'cristo');$('pBond').textContent=pb.bondinho;$('pdBond').textContent=pb.date?fmtDate(pb.date):'—';$('pCristo').textContent=pc.cristo;$('pdCristo').textContent=pc.date?fmtDate(pc.date):'—';$('strength').textContent=cr?`${Math.round(b/cr*100)}%`:'—';let gap=Math.round((1-b/cr)*100);$('overviewInsight').innerHTML=`Em <strong>${c}</strong>, o Bondinho representa aproximadamente <strong>${Math.round(b/cr*100)}%</strong> do interesse do Cristo no recorte selecionado. A diferença sugere uma oportunidade de fortalecer a associação entre <strong>Bondinho</strong> e <strong>Pão de Açúcar</strong>.`}
function timeline(){let r=filtered();Plotly.react('timeline',[{x:r.map(x=>x.date),y:r.map(x=>x.bondinho),name:'Bondinho',mode:'lines+markers',line:{color:'#bc6b34',width:3}},{x:r.map(x=>x.date),y:r.map(x=>x.cristo),name:'Cristo',mode:'lines+markers',line:{color:'#103f32',width:3}}],{...layoutBase,yaxis:{...layoutBase.yaxis,title:'Índice de interesse'}},cfg)}
function yoy(){let c=$('country').value;let rows=D.series[c];let y2025=rows.filter(r=>r.date.startsWith('2025'));let y2026=rows.filter(r=>r.date.startsWith('2026'));let month=r=>new Date(r.date+'T12:00:00').getMonth()+1;Plotly.react('yoy',[{x:y2025.map(month),y:y2025.map(r=>r.bondinho),name:'Bondinho 2025',mode:'lines+markers',line:{color:'#c49a7a',width:2,dash:'dot'}},{x:y2026.map(month),y:y2026.map(r=>r.bondinho),name:'Bondinho 2026',mode:'lines+markers',line:{color:'#bc6b34',width:3}},{x:y2025.map(month),y:y2025.map(r=>r.cristo),name:'Cristo 2025',mode:'lines+markers',line:{color:'#839c93',width:2,dash:'dot'}},{x:y2026.map(month),y:y2026.map(r=>r.cristo),name:'Cristo 2026',mode:'lines+markers',line:{color:'#103f32',width:3}}],{...layoutBase,xaxis:{tickmode:'array',tickvals:[1,2,3,4,5,6,7,8,9,10,11,12],ticktext:['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],gridcolor:'#edf1ee'},yaxis:{...layoutBase.yaxis,title:'Índice de interesse'},legend:{orientation:'h',y:1.18}},cfg)}
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
function safeRun(name,fn){try{fn()}catch(err){console.error(name,err)}}function update(){safeRun('KPIs',updateKPIs);if(window.Plotly){safeRun('Linha do tempo',timeline);safeRun('Comparação anual',yoy);safeRun('Sazonalidade',season)}else{console.error('Plotly não carregou')}if(window.WordCloud){safeRun('Termos',terms)}}countries.forEach(()=>{});$('country').value='Mundo';$('start').value='';$('end').value='';['country','year','start','end'].forEach(id=>$(id).addEventListener('change',update));$('mapTopic').addEventListener('change',()=>safeRun('Mapa',map));$('reset').onclick=()=>{$('country').value='Mundo';$('year').value='2026';$('start').value='';$('end').value='';update()};window.addEventListener('resize',()=>window.WordCloud&&setTimeout(()=>safeRun('Termos',terms),150));update();if(window.Plotly)safeRun('Mapa',map);
