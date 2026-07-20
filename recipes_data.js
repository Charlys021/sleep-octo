/* ============================================================
   Régua de Macros — recipes_data.js
   Receitas simples montadas com itens do FOOD_DB (nome exato + gramas).
   diet: 'comum' | 'vegetariano' | 'vegano'  (vegano também serve pra vegetariano)
   meal: chave de MEALS ('cafe','almoco','lanche','jantar') — pode ter mais de uma
============================================================ */
const RECIPES_DB = [
  {
    id:'r1', title:'Frango grelhado, arroz e brócolis', emoji:'🍗',
    diet:'comum', meals:['almoco','jantar'],
    items:[
      {n:'Frango, peito, sem pele, grelhado', g:150},
      {n:'Arroz, tipo 1, cozido', g:150},
      {n:'Brócolis, cozido', g:100},
      {n:'Azeite, de oliva, extra virgem', g:5},
    ]
  },
  {
    id:'r2', title:'Omelete com aveia e banana', emoji:'🍳',
    diet:'vegetariano', meals:['cafe'],
    items:[
      {n:'Ovo, de galinha, inteiro, cru', g:120},
      {n:'Aveia, flocos, crua', g:40},
      {n:'Banana, prata, crua', g:100},
    ]
  },
  {
    id:'r3', title:'Tapioca com queijo minas', emoji:'🫓',
    diet:'vegetariano', meals:['cafe','lanche'],
    items:[
      {n:'Tapioca, com manteiga', g:80},
      {n:'Queijo, minas, frescal', g:30},
    ]
  },
  {
    id:'r4', title:'Salada de grão-de-bico', emoji:'🥗',
    diet:'vegano', meals:['almoco'],
    items:[
      {n:'Grão-de-bico, cru', g:80},
      {n:'Tomate, salada', g:100},
      {n:'Pepino, cru', g:100},
      {n:'Azeite, de oliva, extra virgem', g:10},
    ]
  },
  {
    id:'r5', title:'Feijão preto, arroz integral e carne', emoji:'🍛',
    diet:'comum', meals:['almoco'],
    items:[
      {n:'Feijão, preto, cozido', g:150},
      {n:'Arroz, integral, cozido', g:150},
      {n:'Carne, bovina, acém, sem gordura, cozido', g:120},
    ]
  },
  {
    id:'r6', title:'Iogurte com aveia e morango', emoji:'🍓',
    diet:'vegetariano', meals:['cafe','lanche'],
    items:[
      {n:'Iogurte, natural', g:170},
      {n:'Aveia, flocos, crua', g:30},
      {n:'Morango, cru', g:80},
    ]
  },
  {
    id:'r7', title:'Salmão grelhado com batata doce', emoji:'🐟',
    diet:'comum', meals:['jantar','almoco'],
    items:[
      {n:'Salmão, sem pele, fresco, grelhado', g:150},
      {n:'Batata, doce, cozida', g:150},
      {n:'Couve, manteiga, refogada', g:80},
    ]
  },
  {
    id:'r8', title:'Sanduíche de atum', emoji:'🥪',
    diet:'comum', meals:['lanche'],
    items:[
      {n:'Atum, conserva em óleo', g:80},
      {n:'Pão, trigo, forma, integral', g:60},
      {n:'Alface, crespa, crua', g:20},
      {n:'Tomate, salada', g:50},
    ]
  },
  {
    id:'r9', title:'Shake de whey com banana', emoji:'🥤',
    diet:'vegetariano', meals:['lanche'],
    items:[
      {n:'Whey protein, concentrado, pó (média de mercado)', g:30},
      {n:'Banana, prata, crua', g:100},
      {n:'Leite, de vaca, desnatado, líquido', g:200},
    ]
  },
  {
    id:'r10', title:'Tofu salteado com legumes', emoji:'🥦',
    diet:'vegano', meals:['jantar','almoco'],
    items:[
      {n:'Soja, queijo (tofu)', g:150},
      {n:'Abobrinha, italiana, cozida', g:100},
      {n:'Cenoura, cozida', g:80},
      {n:'Óleo, de soja, refinado', g:8},
    ]
  },
  {
    id:'r11', title:'Panqueca de aveia e ovo', emoji:'🥞',
    diet:'vegetariano', meals:['cafe'],
    items:[
      {n:'Aveia, flocos, crua', g:50},
      {n:'Ovo, de galinha, inteiro, cru', g:50},
      {n:'Leite, de vaca, semidesnatado, líquido', g:60},
    ]
  },
  {
    id:'r12', title:'Lentilha com arroz e cenoura', emoji:'🍲',
    diet:'vegano', meals:['almoco'],
    items:[
      {n:'Lentilha, cozida', g:150},
      {n:'Arroz, tipo 1, cozido', g:150},
      {n:'Cenoura, cozida', g:80},
    ]
  },
  {
    id:'r13', title:'Frango com batata doce e chuchu', emoji:'🍽️',
    diet:'comum', meals:['almoco','jantar'],
    items:[
      {n:'Frango, peito, sem pele, grelhado', g:150},
      {n:'Batata, doce, cozida', g:150},
      {n:'Chuchu, cozido', g:100},
    ]
  },
  {
    id:'r14', title:'Sanduíche de peito de peru', emoji:'🦃',
    diet:'comum', meals:['lanche'],
    items:[
      {n:'Peru, congelado, assado', g:60},
      {n:'Pão, trigo, forma, integral', g:60},
      {n:'Queijo, prato', g:20},
    ]
  },
  {
    id:'r15', title:'Mix de castanhas e uva', emoji:'🥜',
    diet:'vegano', meals:['lanche'],
    items:[
      {n:'Castanha-do-Brasil, crua', g:15},
      {n:'Amêndoa, torrada, salgada', g:15},
      {n:'Uva, Itália, crua', g:50},
    ]
  },
  {
    id:'r16', title:'Crepioca proteica', emoji:'🌯',
    diet:'vegetariano', meals:['cafe','lanche'],
    items:[
      {n:'Ovo, de galinha, inteiro, cru', g:100},
      {n:'Fécula, de mandioca', g:30},
      {n:'Queijo, minas, frescal', g:30},
    ]
  },
];
