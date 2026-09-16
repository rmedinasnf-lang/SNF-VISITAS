const templates={dafPolimero:{title:'DAF · Polímero',fields:[['Equipo',''],['Producto',''],['Caudal','m³/h'],['Dosis polímero','ppm'],['Concentración polímero','g/L'],['SST afluente','mg/L'],['Ratio','kg polímero/t SST'],['Carga másica','kg/h'],['SST efluente','mg/L'],['Remoción de SST','%']],ops:[['Presión bomba presurización','bar'],['Presión de saturación','bar'],['Flujo de aire','L/min']]},dafCoagulante:{title:'DAF · Coagulante',fields:[['Equipo',''],['Producto',''],['Caudal','m³/h'],['Dosis coagulante','ppm'],['SST afluente','mg/L'],['Carga másica','kg/h'],['SST efluente','mg/L'],['Remoción de SST','%']],ops:[['Presión bomba presurización','bar'],['Presión de saturación','bar'],['Flujo de aire','L/min']]},decanter:{title:'Decanter',fields:[['Equipo',''],['Producto',''],['Caudal','m³/h'],['Dosis polímero','ppm'],['Concentración polímero','g/L'],['SST afluente','mg/L'],['Ratio','kg polímero/t SST'],['Carga másica','kg/h'],['SST clarificado','mg/L'],['Remoción de SST','%']],ops:[['Velocidad diferencial','rpm'],['Torque','%'],['Punto de inyección',''],['Humedad','%']]}};
let state=JSON.parse(localStorage.getItem('snfVisit')||'null')||{visit:{cliente:'',planta:'',fecha:new Date().toISOString().slice(0,10),ingeniero:'Rodrigo Medina',participantes:'',objetivo:'',descripcion:'',observaciones:'',recomendaciones:'',emailCliente:'',copia:'',asunto:'Informe de visita técnica SNF'},equipment:['dafPolimero','decanter','dafCoagulante'].map(makeEq)};let current=0;
function makeEq(type){return{id:Date.now()+Math.random(),type,fields:templates[type].fields.map(x=>({name:x[0],unit:x[1],value:''})),ops:templates[type].ops.map(x=>({name:x[0],unit:x[1],value:''}))}}
const esc=s=>String(s||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function save(){localStorage.setItem('snfVisit',JSON.stringify(state));stats()}
function field(k,label,type='input',wide=''){let v=esc(state.visit[k]);return `<div class="field ${wide}"><label>${label}</label>${type==='textarea'?`<textarea data-v="${k}">${v}</textarea>`:`<input ${type==='date'?'type="date"':''} data-v="${k}" value="${v}">`}</div>`}
function render(){document.querySelector('#tabs').innerHTML=['Visita','Equipos','Informe','Correo'].map((x,i)=>`<button class="${i===current?'active':''}" data-tab="${i}">${i+1}. ${x}</button>`).join('');let html='';if(current===0)html=`<section class="panel"><h2>Datos generales</h2><div class="grid2">${field('cliente','Cliente')}${field('planta','Planta / ubicación')}${field('fecha','Fecha','date')}${field('ingeniero','Ingeniero')}${field('participantes','Participantes','input','wide')}${field('objetivo','Objetivo de la visita','textarea','wide')}${field('descripcion','Descripción del trabajo realizado','textarea','wide')}</div><div class="actions"><button class="btn primary" data-next>Continuar</button></div></section>`;if(current===1)html=`<div class="toolbar panel"><b>Agregar tabla:</b><button class="btn" data-add="dafPolimero">+ DAF polímero</button><button class="btn" data-add="dafCoagulante">+ DAF coagulante</button><button class="btn" data-add="decanter">+ Decanter</button></div>${state.equipment.map(eqCard).join('')}<div class="actions"><button class="btn primary" data-next>Generar informe</button></div>`;if(current===2)html=`<section class="panel"><h2>Conclusiones</h2>${field('observaciones','Observaciones de terreno','textarea')}${field('recomendaciones','Recomendaciones al cliente','textarea')}</section>${report()}<div class="actions"><button class="btn" data-save>Guardar</button><button class="btn primary" data-next>Preparar correo</button></div>`;if(current===3)html=`<section class="panel"><h2>Enviar informe desde SNF</h2><div class="grid2">${field('emailCliente','Correo del cliente')}${field('copia','Copia')}${field('asunto','Asunto','input','wide')}</div><p class="muted">El botón abre el cliente de correo del teléfono con el asunto y cuerpo preparados. Para adjuntar automáticamente un PDF y enviar desde Outlook corporativo se requiere una integración de servidor o Power Automate.</p><div class="actions"><button class="btn" data-print>Guardar como PDF</button><button class="btn primary" data-email>Abrir correo</button></div></section>`;document.querySelector('#pages').innerHTML=html;bind();stats()}
function eqCard(eq){let rows=(group)=>eq[group].map((f,i)=>`<div class="erow"><span>${f.name}</span><span>${f.unit}</span><input data-eq="${eq.id}" data-group="${group}" data-i="${i}" value="${esc(f.value)}"></div>`).join('');return `<section class="equipment"><div class="eqhead"><b>${templates[eq.type].title}</b><button class="btn" data-del="${eq.id}">Eliminar</button></div>${rows('fields')}<div class="subtitle">Datos operacionales</div>${rows('ops')}</section>`}
function report(){return `<section class="panel"><div class="report" id="report"><b>SNF WATER SCIENCE</b><h2>Informe de visita técnico-comercial</h2><p>${esc(state.visit.fecha)} · ${esc(state.visit.planta||'Planta')}</p><h3>Cliente</h3><p>${esc(state.visit.cliente)||'Sin completar'}</p><h3>Objetivo</h3><p>${esc(state.visit.objetivo)||'Sin completar'}</p><h3>Descripción</h3><p>${esc(state.visit.descripcion)||'Sin completar'}</p>${state.equipment.map((e,n)=>`<h3>Tabla ${n+1}. ${templates[e.type].title}</h3><table><tbody>${[...e.fields,...e.ops].map(f=>`<tr><td><b>${f.name}</b></td><td>${f.unit}</td><td>${esc(f.value)||'-'}</td></tr>`).join('')}</tbody></table>`).join('')}<h3>Observaciones</h3><p>${esc(state.visit.observaciones)||'Sin observaciones registradas'}</p><h3>Recomendaciones al cliente</h3><p>${esc(state.visit.recomendaciones)||'Pendiente de completar'}</p></div></section>`}
function bind(){document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{current=+b.dataset.tab;render()});document.querySelectorAll('[data-v]').forEach(x=>x.oninput=()=>{state.visit[x.dataset.v]=x.value;save()});document.querySelectorAll('[data-eq]').forEach(x=>x.oninput=()=>{let e=state.equipment.find(e=>e.id==x.dataset.eq);e[x.dataset.group][+x.dataset.i].value=x.value;save()});document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{state.equipment.push(makeEq(b.dataset.add));save();render()});document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{state.equipment=state.equipment.filter(e=>e.id!=b.dataset.del);save();render()});document.querySelector('[data-next]')?.addEventListener('click',()=>{current=Math.min(3,current+1);render()});document.querySelector('[data-save]')?.addEventListener('click',()=>note('Visita guardada en el dispositivo'));document.querySelector('[data-print]')?.addEventListener('click',()=>window.print());document.querySelector('[data-email]')?.addEventListener('click', () => {
2
 
3
let v = state.visit;
4
 
5
if (!v.emailCliente.includes('@')) {
6
return note('Introduce un correo válido');
7
}
8
 
9
let cuerpo =
10
`Estimado/a,
11
 
12
Junto con saludar, comparto el informe de la visita realizada en ${v.planta} el ${v.fecha}.
13
 
14
OBSERVACIONES:
15
${v.observaciones}
16
 
17
RECOMENDACIONES:
18
${v.recomendaciones}
19
 
20
Saludos cordiales,
21
 
22
${v.ingeniero}
23
SNF Chile`;
24
 
25
const outlookUrl =
26
`https://outlook.office.com/mail/deeplink/compose` +
27
`?to=${encodeURIComponent(v.emailCliente)}` +
28
`&cc=${encodeURIComponent(v.copia)}` +
29
`&subject=${encodeURIComponent(v.asunto)}` +
30
`&body=${encodeURIComponent(cuerpo)}`;
31
 
32
window.open(outlookUrl, "_blank");
33
});
