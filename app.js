/* ============================================================
   Régua de Macros — app.js
   Calculadora + Diário + Sugestões + Progresso + Backup
   Tudo salvo localmente no navegador (localStorage), sem servidor.
============================================================ */
const el = id => document.getElementById(id);

const MEALS = [
  { key: 'cafe',   label: 'Café da manhã', emoji: '☀️' },
  { key: 'almoco', label: 'Almoço',        emoji: '🍽️' },
  { key: 'lanche', label: 'Lanche',        emoji: '🍎' },
  { key: 'jantar', label: 'Jantar',        emoji: '🌙' },
];

/* ===================== STORAGE HELPERS ===================== */
function lsGet(key, def){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : def;
  }catch(e){ return def; }
}
function lsSet(key, val){
  try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){}
}

const LS_PROFILE = 'rm_profile_v2';
const LS_DAYS = 'rm_days_v2';
const LS_FAV = 'rm_fav_v2';
const LS_RECENT = 'rm_recent_v2';
const LS_WEIGHT = 'rm_weight_v2';
const LS_THEME = 'rm_theme_v2';
const LS_DIET = 'rm_diet_v3';
const LS_APIKEY = 'rm_apikey_v3';
const LS_REMINDERS = 'rm_reminders_v3';
const LS_SHOPSEL = 'rm_shopsel_v3';

let days = lsGet(LS_DAYS, {});
let favorites = lsGet(LS_FAV, []);
let recent = lsGet(LS_RECENT, []);
let weightLog = lsGet(LS_WEIGHT, []);
let dietProfile = lsGet(LS_DIET, 'nenhum');
let shopSelected = lsGet(LS_SHOPSEL, []);
let reminders = lsGet(LS_REMINDERS, {
  on:false, cafe:'08:00', almoco:'12:00', lanche:'16:00', jantar:'19:30', waterHours:2
});

function emptyDay(){ return { meals:{cafe:[],almoco:[],lanche:[],jantar:[]}, water:0 }; }
function getDay(dateStr){
  if(!days[dateStr]) days[dateStr] = emptyDay();
  if(!days[dateStr].meals) days[dateStr].meals = {cafe:[],almoco:[],lanche:[],jantar:[]};
  MEALS.forEach(m=>{ if(!days[dateStr].meals[m.key]) days[dateStr].meals[m.key] = []; });
  return days[dateStr];
}
function saveDays(){ lsSet(LS_DAYS, days); }
// Read-only accessor that never mutates `days` (used for charts so viewing
// progress doesn't silently create empty-day entries in storage).
function peekDay(dateStr){
  const d = days[dateStr];
  if(!d) return emptyDay();
  const out = { meals:{}, water: d.water||0 };
  MEALS.forEach(m=>{ out.meals[m.key] = d.meals && d.meals[m.key] ? d.meals[m.key] : []; });
  return out;
}

/* ===================== DATE HELPERS ===================== */
function toDateStr(d){
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function todayStr(){ return toDateStr(new Date()); }
function addDays(dateStr, n){
  const [y,m,d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m-1, d);
  dt.setDate(dt.getDate()+n);
  return toDateStr(dt);
}
function fmtDateLabel(dateStr){
  const today = todayStr();
  if(dateStr === today) return 'Hoje';
  if(dateStr === addDays(today,-1)) return 'Ontem';
  if(dateStr === addDays(today,1)) return 'Amanhã';
  const [y,m,d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m-1, d);
  const dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  return dias[dt.getDay()];
}
function fmtDateSub(dateStr){
  const [y,m,d] = dateStr.split('-').map(Number);
  return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;
}

let currentDate = todayStr();
let selectedMeal = 'cafe';

/* ===================== TABS ===================== */
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    btn.classList.add('active');
    const map = { calc:'viewCalc', diario:'viewDiario', foods:'viewFoods', receitas:'viewReceitas', progresso:'viewProgresso' };
    el(map[btn.dataset.tab]).classList.add('active');
    if(btn.dataset.tab === 'diario') renderDiario();
    if(btn.dataset.tab === 'foods') renderFoodsView();
    if(btn.dataset.tab === 'receitas') renderReceitas();
    if(btn.dataset.tab === 'progresso') renderProgresso();
  });
});

/* ===================== THEME ===================== */
function applyTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  el('themeBtn').textContent = t === 'light' ? '☀️' : '🌙';
}
let theme = lsGet(LS_THEME, 'dark');
applyTheme(theme);
el('themeBtn').addEventListener('click', ()=>{
  theme = theme === 'light' ? 'dark' : 'light';
  lsSet(LS_THEME, theme);
  applyTheme(theme);
  renderProgresso();
});

/* ===================== CONFIG MODAL ===================== */
function openCfgModal(){
  el('apiKeyInput').value = lsGet(LS_APIKEY, '');
  el('rtCafe').value = reminders.cafe;
  el('rtAlmoco').value = reminders.almoco;
  el('rtLanche').value = reminders.lanche;
  el('rtJantar').value = reminders.jantar;
  el('rtWaterHours').value = String(reminders.waterHours);
  el('remindToggle').classList.toggle('on', !!reminders.on);
  el('cfgModal').classList.add('show');
}
function closeCfgModal(){ el('cfgModal').classList.remove('show'); }
el('cfgBtn').addEventListener('click', openCfgModal);
el('cfgCloseBtn').addEventListener('click', closeCfgModal);
el('cfgModal').addEventListener('click', (e)=>{ if(e.target.id==='cfgModal') closeCfgModal(); });

el('remindToggle').addEventListener('click', async ()=>{
  const turningOn = !el('remindToggle').classList.contains('on');
  if(turningOn && 'Notification' in window && Notification.permission !== 'granted'){
    const perm = await Notification.requestPermission();
    if(perm !== 'granted'){ toast('Permissão de notificação negada.'); return; }
  }
  el('remindToggle').classList.toggle('on', turningOn);
});

el('cfgSaveBtn').addEventListener('click', ()=>{
  lsSet(LS_APIKEY, el('apiKeyInput').value.trim());
  reminders = {
    on: el('remindToggle').classList.contains('on'),
    cafe: el('rtCafe').value, almoco: el('rtAlmoco').value,
    lanche: el('rtLanche').value, jantar: el('rtJantar').value,
    waterHours: parseInt(el('rtWaterHours').value)||0
  };
  lsSet(LS_REMINDERS, reminders);
  toast('Configurações salvas ✅');
  closeCfgModal();
});

/* ---- Motor de lembretes (funciona com o app aberto) ---- */
function notify(title, body){
  if('Notification' in window && Notification.permission === 'granted'){
    try{ new Notification(title, {body, icon:'icon-192.png'}); }catch(e){}
  } else {
    toast(title + ' — ' + body);
  }
}
function checkReminders(){
  if(!reminders.on) return;
  const now = new Date();
  const hhmm = String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  const today = todayStr();
  const firedKey = 'rm_fired_' + today;
  const fired = lsGet(firedKey, {});

  MEALS.forEach(m=>{
    if(reminders[m.key] === hhmm && !fired[m.key]){
      notify('Hora do ' + m.label.toLowerCase(), 'Não esquece de registrar no Diário 🍽️');
      fired[m.key] = true;
    }
  });

  if(reminders.waterHours > 0){
    const lastWaterKey = 'lastWater';
    const lastMinutes = fired[lastWaterKey];
    const nowMinutes = now.getHours()*60 + now.getMinutes();
    if(lastMinutes==null || nowMinutes - lastMinutes >= reminders.waterHours*60){
      if(now.getHours() >= 7 && now.getHours() <= 22){
        notify('Hora de beber água 💧', 'Registra no Diário quando tomar.');
        fired[lastWaterKey] = nowMinutes;
      }
    }
  }
  lsSet(firedKey, fired);
}
setInterval(checkReminders, 60000);

/* ===================== TOAST ===================== */
let toastTimer = null;
function toast(msg){
  const t = el('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 1800);
}

/* ===================== CALCULADORA ===================== */
let sexo = 'M';
let objetivo = 'manter';
let macroTarget = { kcal:0, prot:0, fat:0, carb:0 };

function loadProfile(){
  const p = lsGet(LS_PROFILE, null);
  if(!p) return;
  if(p.peso!=null) el('peso').value = p.peso;
  if(p.altura!=null) el('altura').value = p.altura;
  if(p.idade!=null) el('idade').value = p.idade;
  if(p.atividade!=null) el('atividade').value = p.atividade;
  if(p.ajuste!=null) el('ajuste').value = p.ajuste;
  if(p.protSlider!=null) el('protSlider').value = p.protSlider;
  if(p.fatSlider!=null) el('fatSlider').value = p.fatSlider;
  if(p.sexo){
    sexo = p.sexo;
    [...el('sexoSeg').children].forEach(b=>b.classList.toggle('active', b.dataset.v===sexo));
  }
  if(p.objetivo){
    objetivo = p.objetivo;
    [...el('goalRow').children].forEach(b=>b.classList.toggle('active', b.dataset.v===objetivo));
  }
}
function saveProfile(){
  lsSet(LS_PROFILE, {
    peso: el('peso').value, altura: el('altura').value, idade: el('idade').value,
    atividade: el('atividade').value, ajuste: el('ajuste').value,
    protSlider: el('protSlider').value, fatSlider: el('fatSlider').value,
    sexo, objetivo
  });
}

el('sexoSeg').addEventListener('click', e=>{
  const btn = e.target.closest('button');
  if(!btn) return;
  [...el('sexoSeg').children].forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  sexo = btn.dataset.v;
  calc();
});

el('goalRow').addEventListener('click', e=>{
  const btn = e.target.closest('.goal-btn');
  if(!btn) return;
  [...el('goalRow').children].forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  objetivo = btn.dataset.v;
  calc();
});

['peso','altura','idade','atividade'].forEach(id=>{
  el(id).addEventListener('input', calc);
  el(id).addEventListener('change', calc);
});
el('ajuste').addEventListener('input', calc);
el('protSlider').addEventListener('input', calc);
el('fatSlider').addEventListener('input', calc);

/* ===================== PERFIL ALIMENTAR ===================== */
const MEAT_CATS = ['Carnes', 'Peixes e frutos do mar'];
const ANIMAL_CATS = ['Carnes', 'Peixes e frutos do mar', 'Ovos', 'Laticínios'];

function foodAllowedByDiet(f){
  if(dietProfile === 'vegano') return !ANIMAL_CATS.includes(f.c);
  if(dietProfile === 'vegetariano') return !MEAT_CATS.includes(f.c);
  return true;
}

function initDietProfileUI(){
  [...el('dietProfileRow').children].forEach(b=>b.classList.toggle('active', b.dataset.v===dietProfile));
  renderDietWarn();
}
el('dietProfileRow').addEventListener('click', e=>{
  const btn = e.target.closest('.radio-pill');
  if(!btn) return;
  [...el('dietProfileRow').children].forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  dietProfile = btn.dataset.v;
  lsSet(LS_DIET, dietProfile);
  renderDietWarn();
  calc();
});

function renderDietWarn(){
  const box = el('dietProfileWarn');
  const msgs = {
    diabetes: 'Perfil Diabetes: prioriza fibra e carboidratos mais espalhados ao longo do dia. Fica de olho em kcal e carbo altos na aba Alimentos — isso aqui não substitui acompanhamento médico/nutricional.',
    lowcarb: 'Perfil Low carb: se o carbo final da régua ficar alto, considera subir a régua de gordura ou baixar o ajuste calórico.',
    vegano: 'Perfil Vegano: a lista de alimentos e as receitas escondem carnes, peixes, ovos e laticínios.',
    vegetariano: 'Perfil Vegetariano: a lista de alimentos e as receitas escondem carnes e peixes.',
  };
  box.innerHTML = msgs[dietProfile] ? `<div class="warn" style="color:var(--muted); background:rgba(155,107,255,.06); border-color:rgba(155,107,255,.25);">${msgs[dietProfile]}</div>` : '';
}

function classificaIMC(imc){
  if(imc < 18.5) return {tag:'Abaixo do peso', color:'var(--cyan)'};
  if(imc < 25) return {tag:'Normal', color:'var(--green)'};
  if(imc < 30) return {tag:'Sobrepeso', color:'var(--red)'};
  return {tag:'Obesidade', color:'var(--red)'};
}

function calc(){
  const peso = parseFloat(el('peso').value) || 0;
  const altura = parseFloat(el('altura').value) || 0;
  const idade = parseFloat(el('idade').value) || 0;
  const fatorAtividade = parseFloat(el('atividade').value);
  const ajuste = parseInt(el('ajuste').value);
  const protPerKg = parseFloat(el('protSlider').value);
  const fatPerKg = parseFloat(el('fatSlider').value);

  el('protVal').textContent = protPerKg.toFixed(1) + ' g/kg';
  el('fatVal').textContent = fatPerKg.toFixed(1) + ' g/kg';
  el('ajusteVal').textContent = (objetivo==='manter' ? '0' : (objetivo==='ganhar' ? '+' : '-') + ajuste) + ' kcal';

  saveProfile();

  if(peso<=0 || altura<=0 || idade<=0) return;

  let tmb = 10*peso + 6.25*altura - 5*idade + (sexo==='M' ? 5 : -161);
  let tdee = tmb * fatorAtividade;

  let kcalFinal = tdee;
  let label = 'kcal / dia para manter';
  if(objetivo==='ganhar'){ kcalFinal = tdee + ajuste; label = 'kcal / dia para ganhar (bulk)'; }
  if(objetivo==='perder'){ kcalFinal = tdee - ajuste; label = 'kcal / dia para perder (cut)'; }

  const protG = protPerKg * peso;
  const fatG = fatPerKg * peso;
  const protKc = protG * 4;
  const fatKc = fatG * 9;
  const carbKc = kcalFinal - protKc - fatKc;
  const carbG = carbKc / 4;

  el('kcalTotal').textContent = Math.round(kcalFinal).toLocaleString('pt-BR');
  el('kcalLabel').textContent = label;

  el('protG').textContent = Math.round(protG) + ' g';
  el('fatG').textContent = Math.round(fatG) + ' g';
  el('carbG').textContent = Math.round(carbG) + ' g';
  el('protKc').textContent = Math.round(protKc) + ' kcal';
  el('fatKc').textContent = Math.round(fatKc) + ' kcal';
  el('carbKc').textContent = Math.round(carbKc) + ' kcal';

  const totalKc = protKc + fatKc + Math.max(carbKc,0);
  const pP = totalKc>0 ? (protKc/totalKc*100) : 33;
  const pF = totalKc>0 ? (fatKc/totalKc*100) : 33;
  const pC = totalKc>0 ? (Math.max(carbKc,0)/totalKc*100) : 34;
  el('segProt').style.flexBasis = pP + '%';
  el('segFat').style.flexBasis = pF + '%';
  el('segCarb').style.flexBasis = pC + '%';
  el('segProt').querySelector('small').textContent = Math.round(protG)+'g';
  el('segFat').querySelector('small').textContent = Math.round(fatG)+'g';
  el('segCarb').querySelector('small').textContent = Math.round(carbG)+'g';

  const warnBox = el('warnBox');
  if(carbKc < 0){
    warnBox.innerHTML = '<div class="warn">Proteína + gordura já passam do total de kcal. Baixa a régua de proteína ou de gordura, ou aumenta o ajuste calórico.</div>';
  } else if((dietProfile==='diabetes' || dietProfile==='lowcarb') && carbG > 130){
    warnBox.innerHTML = `<div class="warn">Carboidrato final ficou em ${Math.round(carbG)}g/dia, acima da faixa que costuma ser usada como referência inicial em perfis ${dietProfile==='diabetes'?'de diabetes':'low carb'} (~130g). Considera subir a régua de gordura ou rever com um profissional.</div>`;
  } else {
    warnBox.innerHTML = '';
  }

  const imc = peso / Math.pow(altura/100, 2);
  el('bmiVal').textContent = imc.toFixed(1);
  const cl = classificaIMC(imc);
  const tag = el('bmiTag');
  tag.textContent = cl.tag;
  tag.style.color = cl.color;
  tag.style.background = 'color-mix(in srgb, ' + cl.color + ' 15%, transparent)';
  tag.style.border = '1px solid ' + cl.color;

  macroTarget = { kcal:kcalFinal, prot:protG, fat:fatG, carb:Math.max(carbG,0) };

  if(el('viewDiario').classList.contains('active')) renderDiario();
}

/* ===================== ALIMENTOS ===================== */
function renderMealTargetRow(){
  el('mealTargetRow').innerHTML = MEALS.map(m=>
    `<div class="chip ${m.key===selectedMeal?'active':''}" data-meal="${m.key}">${m.emoji} ${m.label}</div>`
  ).join('');
  el('mealTargetRow').querySelectorAll('.chip').forEach(chip=>{
    chip.addEventListener('click', ()=>{
      selectedMeal = chip.dataset.meal;
      renderMealTargetRow();
      if(el('photoMealLabel')) el('photoMealLabel').textContent = MEALS.find(m=>m.key===selectedMeal).label;
    });
  });
}

let activeCat = 'Todos';
function specialCats(){ return ['Todos', '★ Favoritos', '🕒 Recentes']; }
function allCats(){ return [...specialCats(), ...Array.from(new Set(FOOD_DB.map(f=>f.c)))]; }

function renderCats(){
  const wrap = el('catScroll');
  wrap.innerHTML = allCats().map(c =>
    `<div class="chip ${c===activeCat?'active':''}" data-cat="${c}">${c}</div>`
  ).join('');
  wrap.querySelectorAll('.chip').forEach(chip=>{
    chip.addEventListener('click', ()=>{
      activeCat = chip.dataset.cat;
      renderCats();
      renderFoods();
    });
  });
}

function renderFoods(){
  const q = el('foodSearch').value.trim().toLowerCase();
  let list = FOOD_DB.filter(foodAllowedByDiet);
  if(activeCat === '★ Favoritos') list = list.filter(f=>favorites.includes(f.n));
  else if(activeCat === '🕒 Recentes') list = list.filter(f=>recent.includes(f.n));
  else if(activeCat !== 'Todos') list = list.filter(f=>f.c===activeCat);
  if(q) list = list.filter(f=>f.n.toLowerCase().includes(q));

  const total = list.length;
  const capped = list.slice(0, 60);
  el('foodCount').textContent = total===0 ? 'Nenhum alimento encontrado' :
    (total>60 ? `Mostrando 60 de ${total} — refina a busca pra achar mais rápido` : `${total} alimento(s)`);

  el('foodList').innerHTML = capped.map((f)=>{
    const idx = FOOD_DB.indexOf(f);
    const isFav = favorites.includes(f.n);
    const extraTag = f.src === 'extra' ? ' <span style="color:var(--amber); opacity:.85;">✦ complementar</span>' : '';
    return `<div class="food-item">
      <div>
        <div class="food-name">${f.n}</div>
        <div class="food-cat">${f.c}${extraTag}</div>
        <div class="food-macro">${f.kcal} kcal · P ${f.p}g · G ${f.f}g · C ${f.cb}g <span style="opacity:.7">(por 100g)</span></div>
      </div>
      <div class="food-actions">
        <button class="star-btn ${isFav?'active':''}" data-idx="${idx}" title="Favoritar">${isFav?'★':'☆'}</button>
        <button class="add-btn" data-idx="${idx}">+</button>
      </div>
    </div>`;
  }).join('');

  el('foodList').querySelectorAll('.star-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const f = FOOD_DB[btn.dataset.idx];
      const i = favorites.indexOf(f.n);
      if(i>=0) favorites.splice(i,1); else favorites.unshift(f.n);
      lsSet(LS_FAV, favorites);
      renderFoods();
    });
  });

  el('foodList').querySelectorAll('.add-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const f = FOOD_DB[btn.dataset.idx];
      addFoodToMeal(f, selectedMeal, currentDate);
      toast(`${f.n} adicionado em ${MEALS.find(m=>m.key===selectedMeal).label}`);
    });
  });
}

function addFoodToMeal(f, mealKey, dateStr){
  const day = getDay(dateStr);
  const item = { name:f.n, kcal:f.kcal, p:f.p, f:f.f, cb:f.cb, grams:100 };
  ['na','k','ca','fe','vc'].forEach(key=>{ if(typeof f[key]==='number') item[key] = f[key]; });
  day.meals[mealKey].push(item);
  saveDays();
  recent = [f.n, ...recent.filter(n=>n!==f.n)].slice(0,20);
  lsSet(LS_RECENT, recent);
}

function renderFoodsView(){
  renderMealTargetRow();
  renderCats();
  renderFoods();
}
el('foodSearch').addEventListener('input', renderFoods);

/* ===================== DIÁRIO ===================== */
function sumMeals(day){
  let sum = {kcal:0,p:0,f:0,cb:0};
  MEALS.forEach(m=>{
    (day.meals[m.key]||[]).forEach(it=>{
      const factor = it.grams/100;
      sum.kcal += it.kcal*factor;
      sum.p += it.p*factor;
      sum.f += it.f*factor;
      sum.cb += it.cb*factor;
    });
  });
  return sum;
}

/* ---- Micronutrientes ---- */
const MICRO_TARGETS = [
  { key:'na', label:'Sódio', unit:'mg', target:2000, color:'var(--red)' },
  { key:'k', label:'Potássio', unit:'mg', target:3500, color:'var(--green)' },
  { key:'ca', label:'Cálcio', unit:'mg', target:1000, color:'var(--cyan)' },
  { key:'fe', label:'Ferro', unit:'mg', target:14, color:'var(--purple)' },
  { key:'vc', label:'Vitamina C', unit:'mg', target:90, color:'var(--amber)' },
];
function sumMicros(day){
  let sum = {na:0,k:0,ca:0,fe:0,vc:0};
  MEALS.forEach(m=>{
    (day.meals[m.key]||[]).forEach(it=>{
      const factor = it.grams/100;
      ['na','k','ca','fe','vc'].forEach(key=>{
        if(typeof it[key] === 'number') sum[key] += it[key]*factor;
      });
    });
  });
  return sum;
}
function renderMicroGrid(){
  const day = getDay(currentDate);
  const sum = sumMicros(day);
  el('microGrid').innerHTML = MICRO_TARGETS.map(mt=>{
    const val = sum[mt.key] || 0;
    const pct = Math.min(100, (val/mt.target)*100);
    const over = mt.key==='na' && val>mt.target;
    return `<div class="macro-pill">
      <span class="dot" style="background:${mt.color};"></span>${mt.label}
      <div class="bar-track" style="margin-top:8px;"><div class="bar-fill" style="width:${pct}%; background:${over?'var(--red)':mt.color};"></div></div>
      <div class="kc" style="margin-top:4px;">${Math.round(val)} / ${mt.target} ${mt.unit}</div>
    </div>`;
  }).join('');
}

function setBarGeneric(barId, txtId, val, target, unit, color){
  const pct = target>0 ? Math.min(100, (val/target)*100) : 0;
  const bar = el(barId);
  bar.style.width = pct + '%';
  bar.style.background = (target>0 && val>target) ? 'var(--red)' : color;
  el(txtId).textContent = Math.round(val) + unit + ' / ' + Math.round(target) + unit;
}

function updateDateNav(){
  el('dateLabel').textContent = fmtDateLabel(currentDate);
  el('dateSub').textContent = fmtDateSub(currentDate);
}

el('prevDay').addEventListener('click', ()=>{ currentDate = addDays(currentDate,-1); renderDiario(); });
el('nextDay').addEventListener('click', ()=>{ currentDate = addDays(currentDate,1); renderDiario(); });

function renderMealSections(){
  const day = getDay(currentDate);
  el('mealSections').innerHTML = MEALS.map(m=>{
    const items = day.meals[m.key];
    let subKcal = items.reduce((a,it)=>a + it.kcal*(it.grams/100), 0);
    const body = items.length===0
      ? `<div class="empty-plate">Nada aqui ainda.</div>`
      : items.map((it,i)=>{
          const kc = Math.round(it.kcal*(it.grams/100));
          return `<div class="meal-item">
            <div>
              <div class="name">${it.name}</div>
              <div class="kc">${kc} kcal</div>
            </div>
            <input type="number" min="0" step="5" value="${it.grams}" data-meal="${m.key}" data-i="${i}" class="gramsInput"> g
            <button class="rm-btn" data-meal="${m.key}" data-i="${i}">✕</button>
          </div>`;
        }).join('');
    return `<div class="meal-section" data-meal-section="${m.key}">
      <div class="meal-head"><span class="mname">${m.emoji} ${m.label}</span><span class="mkcal">${Math.round(subKcal)} kcal</span></div>
      ${body}
    </div>`;
  }).join('');

  el('mealSections').querySelectorAll('.gramsInput').forEach(inp=>{
    inp.addEventListener('input', ()=>{
      const d = getDay(currentDate);
      d.meals[inp.dataset.meal][inp.dataset.i].grams = parseFloat(inp.value) || 0;
      saveDays();
      renderMealSections();
      renderDiarySummary();
    });
  });
  el('mealSections').querySelectorAll('.rm-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const d = getDay(currentDate);
      d.meals[btn.dataset.meal].splice(btn.dataset.i,1);
      saveDays();
      renderMealSections();
      renderDiarySummary();
      renderSuggestions();
    });
  });
}

function renderDiarySummary(){
  const day = getDay(currentDate);
  const sum = sumMeals(day);
  setBarGeneric('dBarKcal','dBarKcalTxt', sum.kcal, macroTarget.kcal, '', 'var(--cyan)');
  setBarGeneric('dBarProt','dBarProtTxt', sum.p, macroTarget.prot, 'g', 'var(--purple)');
  setBarGeneric('dBarFat','dBarFatTxt', sum.f, macroTarget.fat, 'g', 'var(--red)');
  setBarGeneric('dBarCarb','dBarCarbTxt', sum.cb, macroTarget.carb, 'g', 'var(--green)');

  const peso = parseFloat(el('peso').value) || 70;
  const waterGoal = Math.round(peso*35/50)*50;
  const water = day.water || 0;
  el('waterVal').textContent = `${water} ml / ${waterGoal} ml`;
}

el('waterAdd').addEventListener('click', ()=>{
  const day = getDay(currentDate);
  day.water = (day.water||0) + 250;
  saveDays();
  renderDiarySummary();
});
el('waterSub').addEventListener('click', ()=>{
  const day = getDay(currentDate);
  day.water = Math.max(0,(day.water||0) - 250);
  saveDays();
  renderDiarySummary();
});

el('copyYesterday').addEventListener('click', ()=>{
  const y = addDays(currentDate,-1);
  const src = getDay(y);
  const hasAny = MEALS.some(m=>src.meals[m.key].length>0);
  if(!hasAny){ toast('Não há refeições no dia anterior pra copiar.'); return; }
  const dst = getDay(currentDate);
  MEALS.forEach(m=>{
    dst.meals[m.key] = src.meals[m.key].map(it=>({...it}));
  });
  saveDays();
  renderMealSections();
  renderDiarySummary();
  renderSuggestions();
  toast('Refeições copiadas de ontem ✅');
});

el('clearDay').addEventListener('click', ()=>{
  days[currentDate] = emptyDay();
  saveDays();
  renderMealSections();
  renderDiarySummary();
  renderSuggestions();
  toast('Dia limpo.');
});

/* ---- Sugestão inteligente ---- */
function renderSuggestions(){
  const box = el('suggestList');
  if(!macroTarget.kcal){
    box.innerHTML = '<div class="empty-plate">Preenche teu perfil na Calculadora pra receber sugestões.</div>';
    return;
  }
  const day = getDay(currentDate);
  const sum = sumMeals(day);
  const remKcal = macroTarget.kcal - sum.kcal;
  const remProt = macroTarget.prot - sum.p;
  const remFat = macroTarget.fat - sum.f;
  const remCarb = macroTarget.carb - sum.cb;

  if(remKcal <= 20){
    box.innerHTML = '<div class="empty-plate">🎉 Meta calórica batida (ou quase) pra hoje!</div>';
    return;
  }

  const ratios = [
    { key:'prot', label:'proteína', color:'var(--purple)', ratio: macroTarget.prot>0 ? sum.p/macroTarget.prot : 1, rem: remProt },
    { key:'fat', label:'gordura', color:'var(--red)', ratio: macroTarget.fat>0 ? sum.f/macroTarget.fat : 1, rem: remFat },
    { key:'carb', label:'carbo', color:'var(--green)', ratio: macroTarget.carb>0 ? sum.cb/macroTarget.carb : 1, rem: remCarb },
  ].filter(r=>r.rem > 2).sort((a,b)=>a.ratio-b.ratio);

  if(ratios.length===0){
    box.innerHTML = '<div class="empty-plate">Macros praticamente batidos — só falta um pouco de calorias.</div>';
    return;
  }

  const priority = ratios[0]; // macro mais atrasado em relação à meta

  const kcalBudget = Math.max(remKcal, 50);
  const macroField = { prot:'p', fat:'f', carb:'cb' }[priority.key];

  let candidates = FOOD_DB
    .filter(foodAllowedByDiet)
    .filter(f=>f.kcal > 5 && f.kcal <= kcalBudget + 200)
    .map(f=>({ f, density: f[macroField] / f.kcal }))
    .filter(c=>c.density > 0)
    .sort((a,b)=>b.density - a.density);

  // remove duplicated names, keep top 6
  const seen = new Set();
  const top = [];
  for(const c of candidates){
    if(seen.has(c.f.n)) continue;
    seen.add(c.f.n);
    top.push(c.f);
    if(top.length>=6) break;
  }

  if(top.length===0){
    box.innerHTML = '<div class="empty-plate">Sem sugestões pra esse momento — dá uma olhada na aba Alimentos.</div>';
    return;
  }

  box.innerHTML = `<div style="font-size:11.5px; color:var(--muted); margin-bottom:8px;">
    Faltam <strong style="color:${priority.color}">${Math.round(priority.rem)}${priority.key==='prot'||priority.key==='fat'||priority.key==='carb'?'g':''} de ${priority.label}</strong> —
    aqui vão opções ricas nesse macro, dentro do teu orçamento calórico de hoje:
  </div>` + top.map(f=>{
    const idx = FOOD_DB.indexOf(f);
    return `<div class="suggest-item">
      <div>
        <div class="suggest-name">${f.n}</div>
        <div class="suggest-why">${f.kcal} kcal · P ${f.p}g · G ${f.f}g · C ${f.cb}g (100g)</div>
        <span class="suggest-tag" style="color:${priority.color}; background:color-mix(in srgb, ${priority.color} 15%, transparent); border:1px solid ${priority.color};">rico em ${priority.label}</span>
      </div>
      <button class="add-btn" data-idx="${idx}">+</button>
    </div>`;
  }).join('');

  box.querySelectorAll('.add-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const f = FOOD_DB[btn.dataset.idx];
      addFoodToMeal(f, selectedMeal, currentDate);
      toast(`${f.n} adicionado em ${MEALS.find(m=>m.key===selectedMeal).label}`);
      renderMealSections();
      renderDiarySummary();
      renderSuggestions();
    });
  });
}
el('refreshSuggest').addEventListener('click', renderSuggestions);

/* ---- Streak ---- */
function computeStreak(){
  let streak = 0;
  let d = todayStr();
  const todayHas = days[d] && MEALS.some(m=>(days[d].meals[m.key]||[]).length>0);
  if(!todayHas) d = addDays(d,-1); // allow streak to still show through end of previous day
  while(true){
    const day = days[d];
    const has = day && MEALS.some(m=>(day.meals[m.key]||[]).length>0);
    if(!has) break;
    streak++;
    d = addDays(d,-1);
  }
  return streak;
}
function renderStreak(){
  const s = computeStreak();
  if(s>0){
    el('streakBadge').style.display = 'inline-flex';
    el('streakVal').textContent = s;
  } else {
    el('streakBadge').style.display = 'none';
  }
}

function renderDiario(){
  updateDateNav();
  renderMealSections();
  renderDiarySummary();
  renderSuggestions();
  renderStreak();
  renderMicroGrid();
  el('photoMealLabel').textContent = MEALS.find(m=>m.key===selectedMeal).label;
}

/* ===================== PROGRESSO ===================== */
function loggedDates(){
  return Object.keys(days).filter(d=>{
    const day = days[d];
    return MEALS.some(m=>(day.meals[m.key]||[]).length>0);
  }).sort();
}

function renderStats(){
  const dates = loggedDates();
  el('statDias').textContent = dates.length;
  if(dates.length===0){
    el('statMedia').textContent = '0';
    el('statProtMedia').textContent = '0g';
    return;
  }
  let totalKcal=0, totalProt=0;
  dates.forEach(d=>{
    const s = sumMeals(getDay(d));
    totalKcal += s.kcal; totalProt += s.p;
  });
  el('statMedia').textContent = Math.round(totalKcal/dates.length).toLocaleString('pt-BR');
  el('statProtMedia').textContent = Math.round(totalProt/dates.length) + 'g';
}

function setupCanvas(canvas){
  const ratio = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || canvas.parentElement.clientWidth || 300;
  const h = parseInt(canvas.getAttribute('height')) || 140;
  canvas.width = w*ratio;
  canvas.height = h*ratio;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ratio,0,0,ratio,0,0);
  return { ctx, w, h };
}
function cssVar(name){
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function drawKcalChart(){
  const canvas = el('kcalChart');
  if(!canvas.clientWidth) return;
  const { ctx, w, h } = setupCanvas(canvas);
  ctx.clearRect(0,0,w,h);

  const days14 = [];
  for(let i=13;i>=0;i--) days14.push(addDays(todayStr(), -i));
  const vals = days14.map(d=>sumMeals(peekDay(d)).kcal);
  const target = macroTarget.kcal || 0;
  const maxV = Math.max(target, ...vals, 100) * 1.15;

  const padL = 4, padR = 4, padT = 8, padB = 18;
  const chartW = w - padL - padR, chartH = h - padT - padB;
  const barGap = 4;
  const barW = (chartW/14) - barGap;

  const muted = cssVar('--muted');
  const purple = cssVar('--purple');
  const cyan = cssVar('--cyan');

  if(target>0){
    const ty = padT + chartH - (target/maxV)*chartH;
    ctx.strokeStyle = cyan;
    ctx.setLineDash([4,4]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, ty); ctx.lineTo(w-padR, ty); ctx.stroke();
    ctx.setLineDash([]);
  }

  days14.forEach((d,i)=>{
    const v = vals[i];
    const bh = (v/maxV)*chartH;
    const x = padL + i*(barW+barGap);
    const y = padT + chartH - bh;
    ctx.fillStyle = purple;
    ctx.globalAlpha = d===todayStr() ? 1 : 0.5;
    ctx.fillRect(x, y, barW, bh);
    ctx.globalAlpha = 1;

    ctx.fillStyle = muted;
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    const [,,dd] = d.split('-');
    ctx.fillText(dd, x+barW/2, h-4);
  });
}

function drawWeightChart(){
  const canvas = el('weightChart');
  if(!canvas.clientWidth) return;
  const { ctx, w, h } = setupCanvas(canvas);
  ctx.clearRect(0,0,w,h);
  const muted = cssVar('--muted');
  const cyan = cssVar('--cyan');

  if(weightLog.length<2){
    ctx.fillStyle = muted;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Registra pelo menos 2 pesagens pra ver o gráfico', w/2, h/2);
    return;
  }
  const sorted = [...weightLog].sort((a,b)=>a.date.localeCompare(b.date));
  const vals = sorted.map(e=>e.kg);
  const minV = Math.min(...vals)-0.5, maxV = Math.max(...vals)+0.5;
  const padL = 8, padR = 8, padT = 10, padB = 16;
  const chartW = w-padL-padR, chartH = h-padT-padB;

  ctx.strokeStyle = cyan;
  ctx.lineWidth = 2;
  ctx.beginPath();
  sorted.forEach((e,i)=>{
    const x = padL + (i/(sorted.length-1))*chartW;
    const y = padT + chartH - ((e.kg-minV)/(maxV-minV))*chartH;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();

  ctx.fillStyle = cyan;
  sorted.forEach((e,i)=>{
    const x = padL + (i/(sorted.length-1))*chartW;
    const y = padT + chartH - ((e.kg-minV)/(maxV-minV))*chartH;
    ctx.beginPath(); ctx.arc(x,y,2.5,0,Math.PI*2); ctx.fill();
  });

  ctx.fillStyle = muted;
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(sorted[0].date.slice(5), padL, h-2);
  ctx.textAlign = 'right';
  ctx.fillText(sorted[sorted.length-1].date.slice(5), w-padR, h-2);
}

function renderWeightLog(){
  const sorted = [...weightLog].sort((a,b)=>b.date.localeCompare(a.date));
  if(sorted.length===0){
    el('weightLog').innerHTML = '<div class="empty-plate">Nenhum registro ainda.</div>';
    return;
  }
  el('weightLog').innerHTML = sorted.map((e,i)=>{
    const prev = sorted[i+1];
    let deltaHtml = '';
    if(prev){
      const d = (e.kg - prev.kg);
      const cls = d>0 ? 'delta-up' : (d<0 ? 'delta-down' : '');
      deltaHtml = `<span class="${cls}">${d>0?'+':''}${d.toFixed(1)} kg</span>`;
    }
    return `<div class="weight-log-item"><span>${fmtDateSub(e.date)}</span><span>${e.kg.toFixed(1)} kg &nbsp; ${deltaHtml}</span></div>`;
  }).join('');
}

el('weightAdd').addEventListener('click', ()=>{
  const v = parseFloat(el('weightInput').value);
  if(!v || v<=0){ toast('Informe um peso válido.'); return; }
  const idx = weightLog.findIndex(e=>e.date===todayStr());
  if(idx>=0) weightLog[idx].kg = v; else weightLog.push({date:todayStr(), kg:v});
  lsSet(LS_WEIGHT, weightLog);
  el('weightInput').value = '';
  toast('Peso registrado ✅');
  renderProgresso();
});

function weekAverages(startOffsetDays){
  // startOffsetDays: 0 = últimos 7 dias (hoje-6..hoje), 7 = os 7 anteriores a esses
  let totalKcal=0, totalP=0, totalF=0, totalC=0, loggedDays=0, onTargetDays=0;
  for(let i=0;i<7;i++){
    const d = addDays(todayStr(), -(i+startOffsetDays));
    const day = peekDay(d);
    const has = MEALS.some(m=>(day.meals[m.key]||[]).length>0);
    if(!has) continue;
    loggedDays++;
    const s = sumMeals(day);
    totalKcal += s.kcal; totalP += s.p; totalF += s.f; totalC += s.cb;
    if(macroTarget.kcal>0 && Math.abs(s.kcal-macroTarget.kcal) <= macroTarget.kcal*0.1) onTargetDays++;
  }
  return {
    loggedDays,
    avgKcal: loggedDays ? totalKcal/loggedDays : 0,
    avgP: loggedDays ? totalP/loggedDays : 0,
    avgF: loggedDays ? totalF/loggedDays : 0,
    avgC: loggedDays ? totalC/loggedDays : 0,
    adherencePct: loggedDays ? Math.round(onTargetDays/loggedDays*100) : 0,
  };
}
function trendArrow(curr, prev){
  if(prev<=0 || curr<=0) return '<span class="trend-flat">—</span>';
  const diff = curr - prev;
  if(Math.abs(diff) < prev*0.03) return '<span class="trend-flat">≈ estável</span>';
  return diff>0 ? `<span class="trend-up">▲ +${Math.round(diff)}</span>` : `<span class="trend-down">▼ ${Math.round(diff)}</span>`;
}
function renderWeekReport(){
  const curr = weekAverages(0);
  const prev = weekAverages(7);
  if(curr.loggedDays===0){
    el('weekReport').innerHTML = '<div class="empty-plate">Registra refeições nos últimos 7 dias pra ver o relatório.</div>';
    return;
  }
  el('weekReport').innerHTML = `
    <div class="week-compare"><span>Dias registrados</span><strong>${curr.loggedDays}/7</strong></div>
    <div class="week-compare"><span>Kcal média/dia</span><span>${Math.round(curr.avgKcal)} ${trendArrow(curr.avgKcal, prev.avgKcal)}</span></div>
    <div class="week-compare"><span>Proteína média/dia</span><span>${Math.round(curr.avgP)}g ${trendArrow(curr.avgP, prev.avgP)}</span></div>
    <div class="week-compare"><span>Gordura média/dia</span><span>${Math.round(curr.avgF)}g ${trendArrow(curr.avgF, prev.avgF)}</span></div>
    <div class="week-compare"><span>Carbo média/dia</span><span>${Math.round(curr.avgC)}g ${trendArrow(curr.avgC, prev.avgC)}</span></div>
    <div class="week-compare"><span>Dias dentro de ±10% da meta</span><strong>${curr.adherencePct}%</strong></div>
  `;
}

function renderProgresso(){
  renderStats();
  drawKcalChart();
  drawWeightChart();
  renderWeightLog();
  renderWeekReport();
}
window.addEventListener('resize', ()=>{
  if(el('viewProgresso').classList.contains('active')) renderProgresso();
});

/* ===================== BACKUP ===================== */
el('exportBtn').addEventListener('click', ()=>{
  const backup = {
    version: 3,
    exportedAt: new Date().toISOString(),
    profile: lsGet(LS_PROFILE, {}),
    days, favorites, recent, weightLog,
    theme, dietProfile, reminders, shopSelected
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `regua-macros-backup-${todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('Backup exportado ⬇');
});

el('importBtn').addEventListener('click', ()=> el('importFile').click());
el('importFile').addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const data = JSON.parse(reader.result);
      if(data.days) { days = data.days; saveDays(); }
      if(data.favorites) { favorites = data.favorites; lsSet(LS_FAV, favorites); }
      if(data.recent) { recent = data.recent; lsSet(LS_RECENT, recent); }
      if(data.weightLog) { weightLog = data.weightLog; lsSet(LS_WEIGHT, weightLog); }
      if(data.profile) { lsSet(LS_PROFILE, data.profile); }
      if(data.dietProfile) { lsSet(LS_DIET, data.dietProfile); }
      if(data.reminders) { lsSet(LS_REMINDERS, data.reminders); }
      if(data.shopSelected) { lsSet(LS_SHOPSEL, data.shopSelected); }
      toast('Backup importado ✅ recarregando...');
      setTimeout(()=>location.reload(), 900);
    }catch(err){
      toast('Arquivo inválido.');
    }
  };
  reader.readAsText(file);
});

/* ===================== RECEITAS ===================== */
function foodByName(name){ return FOOD_DB.find(f=>f.n===name); }

function computeRecipeMacros(recipe){
  let sum = {kcal:0,p:0,f:0,cb:0};
  recipe.items.forEach(it=>{
    const f = foodByName(it.n);
    if(!f) return;
    const factor = it.g/100;
    sum.kcal += f.kcal*factor; sum.p += f.p*factor; sum.f += f.f*factor; sum.cb += f.cb*factor;
  });
  return sum;
}

let recipeMealFilter = 'todas';
function recipeAllowedByDiet(r){
  if(dietProfile==='vegano') return r.diet==='vegano';
  if(dietProfile==='vegetariano') return r.diet==='vegano' || r.diet==='vegetariano';
  return true;
}

function renderRecipeFilters(){
  const opts = [
    {v:'todas', l:'Todas'}, {v:'cafe', l:'☀️ Café'}, {v:'almoco', l:'🍽️ Almoço'},
    {v:'lanche', l:'🍎 Lanche'}, {v:'jantar', l:'🌙 Jantar'}
  ];
  el('recipeFilters').innerHTML = opts.map(o=>
    `<div class="chip ${o.v===recipeMealFilter?'active':''}" data-v="${o.v}">${o.l}</div>`
  ).join('');
  el('recipeFilters').querySelectorAll('.chip').forEach(chip=>{
    chip.addEventListener('click', ()=>{
      recipeMealFilter = chip.dataset.v;
      renderRecipeFilters();
      renderRecipeList();
    });
  });
}

function renderRecipeList(){
  let list = RECIPES_DB.filter(recipeAllowedByDiet);
  if(recipeMealFilter !== 'todas') list = list.filter(r=>r.meals.includes(recipeMealFilter));

  if(list.length===0){
    el('recipeList').innerHTML = '<div class="empty-plate">Nenhuma receita pra esse filtro/perfil.</div>';
    return;
  }

  el('recipeList').innerHTML = list.map(r=>{
    const m = computeRecipeMacros(r);
    const ingHtml = r.items.map(it=>`${it.n.split(',')[0]} (${it.g}g)`).join(' · ');
    const isSel = shopSelected.includes(r.id);
    const dietTag = r.diet==='vegano' ? 'Vegano' : (r.diet==='vegetariano' ? 'Vegetariano' : '');
    return `<div class="recipe-card">
      <div class="recipe-head">
        <div>
          <div class="recipe-title">${r.emoji} ${r.title}</div>
          <div class="recipe-tags">
            ${dietTag ? `<span class="recipe-tag">${dietTag}</span>` : ''}
            ${r.meals.map(mk=>`<span class="recipe-tag">${MEALS.find(x=>x.key===mk).label}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="recipe-macro">${Math.round(m.kcal)} kcal · P ${Math.round(m.p)}g · G ${Math.round(m.f)}g · C ${Math.round(m.cb)}g</div>
      <div class="recipe-ing">${ingHtml}</div>
      <div class="recipe-actions">
        <button class="btn-ghost purple" data-add="${r.id}">+ Adicionar ao dia</button>
        <button class="btn-ghost" data-star="${r.id}">${isSel?'★ Na lista':'☆ P/ compras'}</button>
      </div>
    </div>`;
  }).join('');

  el('recipeList').querySelectorAll('[data-add]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const r = RECIPES_DB.find(x=>x.id===btn.dataset.add);
      addRecipeToMeal(r, selectedMeal, currentDate);
      toast(`${r.title} adicionada em ${MEALS.find(m=>m.key===selectedMeal).label}`);
    });
  });
  el('recipeList').querySelectorAll('[data-star]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.dataset.star;
      const i = shopSelected.indexOf(id);
      if(i>=0) shopSelected.splice(i,1); else shopSelected.push(id);
      lsSet(LS_SHOPSEL, shopSelected);
      renderRecipeList();
    });
  });
}

function addRecipeToMeal(recipe, mealKey, dateStr){
  const day = getDay(dateStr);
  recipe.items.forEach(it=>{
    const f = foodByName(it.n);
    if(!f) return;
    day.meals[mealKey].push({ name:f.n, kcal:f.kcal, p:f.p, f:f.f, cb:f.cb, na:f.na, k:f.k, ca:f.ca, fe:f.fe, vc:f.vc, grams:it.g });
  });
  saveDays();
}

el('autoMenuBtn').addEventListener('click', ()=>{
  const allowedRecipes = RECIPES_DB.filter(recipeAllowedByDiet);
  const chosen = {};
  MEALS.forEach(m=>{
    const opts = allowedRecipes.filter(r=>r.meals.includes(m.key));
    if(opts.length>0) chosen[m.key] = opts[Math.floor(Math.random()*opts.length)];
  });
  MEALS.forEach(m=>{
    if(chosen[m.key]) addRecipeToMeal(chosen[m.key], m.key, todayStr());
  });
  const resumo = MEALS.filter(m=>chosen[m.key]).map(m=>`${m.emoji} ${chosen[m.key].title}`).join('<br>');
  el('autoMenuResult').innerHTML = `<div class="micro-note" style="margin-top:12px; font-size:12px;">Adicionado ao dia de hoje:<br>${resumo}</div>`;
  toast('Cardápio de hoje montado ✅');
});

el('genShopList').addEventListener('click', ()=>{
  const recipes = RECIPES_DB.filter(r=>shopSelected.includes(r.id));
  const box = el('shopListResult');
  if(recipes.length===0){
    box.innerHTML = '<div class="empty-plate">Marca pelo menos uma receita com ☆ P/ compras antes de gerar.</div>';
    return;
  }
  const agg = {};
  recipes.forEach(r=>{
    r.items.forEach(it=>{
      agg[it.n] = (agg[it.n]||0) + it.g;
    });
  });
  const lines = Object.entries(agg).sort((a,b)=>a[0].localeCompare(b[0]));
  box.innerHTML = `<div style="margin-top:10px;">` + lines.map(([n,g])=>
    `<div class="shop-list-item"><span>${n}</span><span>${g>=1000 ? (g/1000).toFixed(2)+' kg' : Math.round(g)+' g'}</span></div>`
  ).join('') + `</div>`;
});

function renderReceitas(){
  renderRecipeFilters();
  renderRecipeList();
}

/* ===================== FOTO POR IA ===================== */
let lastPhotoItems = [];

function resizeImageToBase64(file){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    const reader = new FileReader();
    reader.onload = ()=>{ img.src = reader.result; };
    reader.onerror = reject;
    img.onload = ()=>{
      const maxW = 1024;
      const scale = Math.min(1, maxW/img.width);
      const w = Math.round(img.width*scale), h = Math.round(img.height*scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
      resolve(dataUrl.split(',')[1]);
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function callFoodPhotoAI(base64){
  const apiKey = lsGet(LS_APIKEY, '');
  if(!apiKey){
    throw new Error('NO_KEY');
  }
  const prompt = 'Você é um nutricionista. Analise esta foto de uma refeição e estime, para cada alimento visível, o nome em português, o peso aproximado em gramas e os valores nutricionais totais para esse peso (kcal, proteína em g, gordura em g, carboidrato em g). Responda APENAS com um JSON válido, sem markdown e sem texto fora do JSON, no formato exato: {"itens":[{"nome":"string","gramas":number,"kcal":number,"p":number,"f":number,"cb":number}],"obs":"string curta sobre a estimativa"}';

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
          { type: 'text', text: prompt }
        ]
      }]
    })
  });

  if(!resp.ok){
    const errText = await resp.text().catch(()=> '');
    throw new Error('API_ERROR: ' + resp.status + ' ' + errText.slice(0,200));
  }
  const data = await resp.json();
  const textBlock = (data.content || []).find(c=>c.type==='text');
  if(!textBlock) throw new Error('NO_TEXT');
  let clean = textBlock.text.trim().replace(/^```json/i,'').replace(/^```/,'').replace(/```$/,'').trim();
  const parsed = JSON.parse(clean);
  if(!parsed.itens || !Array.isArray(parsed.itens)) throw new Error('BAD_FORMAT');
  return parsed;
}

function renderPhotoResults(parsed){
  lastPhotoItems = parsed.itens.map(it=>({
    name: it.nome, grams: Math.max(1, Math.round(it.gramas)||100),
    kcal: it.kcal||0, p: it.p||0, f: it.f||0, cb: it.cb||0
  }));
  const box = el('photoResults');
  const obsHtml = parsed.obs ? `<div class="micro-note" style="margin-bottom:8px;">${parsed.obs}</div>` : '';
  box.innerHTML = obsHtml + lastPhotoItems.map((it,i)=>`
    <div class="photo-result-item">
      <div>
        <div class="food-name">${it.name}</div>
        <div class="food-macro">${Math.round(it.kcal)} kcal · P ${Math.round(it.p)}g · G ${Math.round(it.f)}g · C ${Math.round(it.cb)}g</div>
      </div>
      <input type="number" min="1" step="5" value="${it.grams}" data-i="${i}" class="photoGrams"> g
    </div>
  `).join('') + `<button class="btn-solid" id="photoAddAllBtn" style="margin-top:12px;">+ Adicionar tudo em ${MEALS.find(m=>m.key===selectedMeal).label}</button>`;

  box.querySelectorAll('.photoGrams').forEach(inp=>{
    inp.addEventListener('input', ()=>{
      lastPhotoItems[inp.dataset.i].grams = parseFloat(inp.value)||1;
    });
  });
  el('photoAddAllBtn').addEventListener('click', ()=>{
    lastPhotoItems.forEach(it=>{
      const factor = 100/it.grams;
      addFoodToMeal({
        n: it.name, kcal: it.kcal*factor, p: it.p*factor, f: it.f*factor, cb: it.cb*factor
      }, selectedMeal, currentDate);
      // ajusta gramas registradas pro valor real estimado (addFoodToMeal grava 100g por padrão)
      const day = getDay(currentDate);
      const arr = day.meals[selectedMeal];
      arr[arr.length-1].grams = it.grams;
    });
    saveDays();
    toast('Itens da foto adicionados ✅');
    box.innerHTML = '';
    lastPhotoItems = [];
    if(el('viewDiario').classList.contains('active')){ renderMealSections(); renderDiarySummary(); renderMicroGrid(); renderSuggestions(); }
  });
}

el('photoBtn').addEventListener('click', ()=> el('photoInput').click());
el('photoInput').addEventListener('change', async (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const apiKey = lsGet(LS_APIKEY, '');
  const statusBox = el('photoStatus');
  el('photoResults').innerHTML = '';
  if(!apiKey){
    statusBox.innerHTML = '<div class="warn">Adiciona tua chave de API da Anthropic em ⚙️ Configurações pra usar esse recurso.</div>';
    return;
  }
  statusBox.innerHTML = '<span class="spinner"></span> Analisando a foto...';
  try{
    const base64 = await resizeImageToBase64(file);
    const parsed = await callFoodPhotoAI(base64);
    statusBox.innerHTML = '';
    renderPhotoResults(parsed);
  }catch(err){
    console.error(err);
    let msg = 'Não consegui analisar a foto. Tenta de novo.';
    if(String(err.message).includes('401')) msg = 'Chave de API inválida — confere em Configurações.';
    if(String(err.message).includes('429')) msg = 'Limite de uso da API atingido, tenta em instantes.';
    statusBox.innerHTML = `<div class="warn">${msg}</div>`;
  }
  e.target.value = '';
});

/* ===================== INIT ===================== */
loadProfile();
initDietProfileUI();
calc();
renderDiario();
renderFoodsView();
renderStreak();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(()=>{});
  });
}
