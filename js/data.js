/* Hello English — contenu pédagogique (100 % original) */
'use strict';

// a = article ("a" / "an" / "") ; say = ce que la voix prononce si différent
const THEMES = [
  { id: 'hello', fr: 'Bonjour !', en: 'Hello!', icon: '👋', bg: '#FFE7A8', tpl: null, items: [
    { id: 'hello', en: 'hello', fr: 'bonjour', e: '👋' },
    { id: 'goodbye', en: 'goodbye', fr: 'au revoir', e: '🚌' },
    { id: 'morning', en: 'good morning', fr: 'bonjour (le matin)', e: '🌅' },
    { id: 'night', en: 'good night', fr: 'bonne nuit', e: '🌙' },
    { id: 'please', en: 'please', fr: "s'il te plaît", e: '🙏' },
    { id: 'thanks', en: 'thank you', fr: 'merci', e: '🎁' },
    { id: 'yes', en: 'yes', fr: 'oui', e: '👍' },
    { id: 'no', en: 'no', fr: 'non', e: '👎' },
  ]},
  { id: 'colours', fr: 'Les couleurs', en: 'Colours', icon: '🎨', bg: '#FFD3E0', tpl: "It's {w}.", items: [
    { id: 'red', en: 'red', fr: 'rouge', c: '#E53935' },
    { id: 'blue', en: 'blue', fr: 'bleu', c: '#1E88E5' },
    { id: 'green', en: 'green', fr: 'vert', c: '#43A047' },
    { id: 'yellow', en: 'yellow', fr: 'jaune', c: '#FDD835' },
    { id: 'orange', en: 'orange', fr: 'orange', c: '#FB8C00' },
    { id: 'pink', en: 'pink', fr: 'rose', c: '#F48FB1' },
    { id: 'purple', en: 'purple', fr: 'violet', c: '#8E24AA' },
    { id: 'black', en: 'black', fr: 'noir', c: '#222222' },
    { id: 'white', en: 'white', fr: 'blanc', c: '#FFFFFF' },
    { id: 'brown', en: 'brown', fr: 'marron', c: '#795548' },
  ]},
  { id: 'numbers', fr: 'Les nombres', en: 'Numbers', icon: '🔢', bg: '#CDEBFF', tpl: "It's {w}.", items: [
    { id: 'n1', en: 'one', fr: 'un', big: '1', n: 1 },
    { id: 'n2', en: 'two', fr: 'deux', big: '2', n: 2 },
    { id: 'n3', en: 'three', fr: 'trois', big: '3', n: 3 },
    { id: 'n4', en: 'four', fr: 'quatre', big: '4', n: 4 },
    { id: 'n5', en: 'five', fr: 'cinq', big: '5', n: 5 },
    { id: 'n6', en: 'six', fr: 'six', big: '6', n: 6 },
    { id: 'n7', en: 'seven', fr: 'sept', big: '7', n: 7 },
    { id: 'n8', en: 'eight', fr: 'huit', big: '8', n: 8 },
    { id: 'n9', en: 'nine', fr: 'neuf', big: '9', n: 9 },
    { id: 'n10', en: 'ten', fr: 'dix', big: '10', n: 10 },
  ]},
  { id: 'animals', fr: 'Les animaux', en: 'Animals', icon: '🐾', bg: '#D7F5D0', tpl: "It's {a} {w}.", items: [
    { id: 'cat', en: 'cat', fr: 'chat', e: '🐱', a: 'a', snd: 'Meow!' },
    { id: 'dog', en: 'dog', fr: 'chien', e: '🐶', a: 'a', snd: 'Woof woof!' },
    { id: 'bird', en: 'bird', fr: 'oiseau', e: '🐦', a: 'a', snd: 'Tweet tweet!' },
    { id: 'fish', en: 'fish', fr: 'poisson', e: '🐟', a: 'a', snd: 'Blub blub!' },
    { id: 'rabbit', en: 'rabbit', fr: 'lapin', e: '🐰', a: 'a' },
    { id: 'horse', en: 'horse', fr: 'cheval', e: '🐴', a: 'a', snd: 'Neigh!' },
    { id: 'cow', en: 'cow', fr: 'vache', e: '🐮', a: 'a', snd: 'Moo!' },
    { id: 'pig', en: 'pig', fr: 'cochon', e: '🐷', a: 'a', snd: 'Oink oink!' },
    { id: 'duck', en: 'duck', fr: 'canard', e: '🦆', a: 'a', snd: 'Quack quack!' },
    { id: 'lion', en: 'lion', fr: 'lion', e: '🦁', a: 'a', snd: 'Roar!' },
    { id: 'elephant', en: 'elephant', fr: 'éléphant', e: '🐘', a: 'an' },
    { id: 'monkey', en: 'monkey', fr: 'singe', e: '🐵', a: 'a', snd: 'Oo oo, aa aa!' },
  ]},
  { id: 'family', fr: 'La famille', en: 'Family', icon: '🏠', bg: '#FFE0C2', tpl: 'This is my {w}.', items: [
    { id: 'mum', en: 'mum', fr: 'maman', e: '👩' },
    { id: 'dad', en: 'dad', fr: 'papa', e: '👨' },
    { id: 'sister', en: 'sister', fr: 'sœur', e: '👧' },
    { id: 'brother', en: 'brother', fr: 'frère', e: '👦' },
    { id: 'baby', en: 'baby', fr: 'bébé', e: '👶' },
    { id: 'grandma', en: 'grandma', fr: 'mamie', e: '👵' },
    { id: 'grandpa', en: 'grandpa', fr: 'papi', e: '👴' },
  ]},
  { id: 'body', fr: 'Le corps', en: 'My body', icon: '🙋', bg: '#FCE1FF', tpl: "It's {a} {w}.", items: [
    { id: 'head', en: 'head', fr: 'tête', e: '🙂', a: 'a' },
    { id: 'eye', en: 'eye', fr: 'œil', e: '👁️', a: 'an' },
    { id: 'nose', en: 'nose', fr: 'nez', e: '👃', a: 'a' },
    { id: 'mouth', en: 'mouth', fr: 'bouche', e: '👄', a: 'a' },
    { id: 'ear', en: 'ear', fr: 'oreille', e: '👂', a: 'an' },
    { id: 'hand', en: 'hand', fr: 'main', e: '✋', a: 'a' },
    { id: 'foot', en: 'foot', fr: 'pied', e: '🦶', a: 'a' },
    { id: 'leg', en: 'leg', fr: 'jambe', e: '🦵', a: 'a' },
    { id: 'arm', en: 'arm', fr: 'bras', e: '💪', a: 'an' },
    { id: 'tooth', en: 'tooth', fr: 'dent', e: '🦷', a: 'a' },
  ]},
  { id: 'food', fr: 'La nourriture', en: 'Food', icon: '🍎', bg: '#FFE3D6', tpl: "It's {a} {w}.", items: [
    { id: 'apple', en: 'apple', fr: 'pomme', e: '🍎', a: 'an' },
    { id: 'banana', en: 'banana', fr: 'banane', e: '🍌', a: 'a' },
    { id: 'bread', en: 'bread', fr: 'pain', e: '🍞', a: '' },
    { id: 'milk', en: 'milk', fr: 'lait', e: '🥛', a: '' },
    { id: 'cake', en: 'cake', fr: 'gâteau', e: '🎂', a: 'a' },
    { id: 'cheese', en: 'cheese', fr: 'fromage', e: '🧀', a: '' },
    { id: 'egg', en: 'egg', fr: 'œuf', e: '🥚', a: 'an' },
    { id: 'pizza', en: 'pizza', fr: 'pizza', e: '🍕', a: 'a' },
    { id: 'carrot', en: 'carrot', fr: 'carotte', e: '🥕', a: 'a' },
    { id: 'strawberry', en: 'strawberry', fr: 'fraise', e: '🍓', a: 'a' },
    { id: 'icecream', en: 'ice cream', fr: 'glace', e: '🍦', a: 'an' },
    { id: 'juice', en: 'juice', fr: 'jus de fruit', e: '🧃', a: '' },
  ]},
  { id: 'clothes', fr: 'Les vêtements', en: 'Clothes', icon: '👕', bg: '#DCE3FF', tpl: "It's {a} {w}.", items: [
    { id: 'hat', en: 'hat', fr: 'chapeau', e: '👒', a: 'a' },
    { id: 'tshirt', en: 'T-shirt', fr: 'tee-shirt', e: '👕', a: 'a' },
    { id: 'dress', en: 'dress', fr: 'robe', e: '👗', a: 'a' },
    { id: 'shoe', en: 'shoe', fr: 'chaussure', e: '👟', a: 'a' },
    { id: 'sock', en: 'sock', fr: 'chaussette', e: '🧦', a: 'a' },
    { id: 'coat', en: 'coat', fr: 'manteau', e: '🧥', a: 'a' },
    { id: 'scarf', en: 'scarf', fr: 'écharpe', e: '🧣', a: 'a' },
    { id: 'glove', en: 'glove', fr: 'gant', e: '🧤', a: 'a' },
    { id: 'cap', en: 'cap', fr: 'casquette', e: '🧢', a: 'a' },
  ]},
  { id: 'toys', fr: 'Jouets & école', en: 'Toys & school', icon: '🧸', bg: '#FFF1C9', tpl: "It's {a} {w}.", items: [
    { id: 'ball', en: 'ball', fr: 'ballon', e: '⚽', a: 'a' },
    { id: 'doll', en: 'doll', fr: 'poupée', e: '🪆', a: 'a' },
    { id: 'teddy', en: 'teddy bear', fr: 'nounours', e: '🧸', a: 'a' },
    { id: 'book', en: 'book', fr: 'livre', e: '📖', a: 'a' },
    { id: 'pencil', en: 'pencil', fr: 'crayon', e: '✏️', a: 'a' },
    { id: 'bag', en: 'bag', fr: 'cartable', e: '🎒', a: 'a' },
    { id: 'car', en: 'car', fr: 'voiture', e: '🚗', a: 'a' },
    { id: 'kite', en: 'kite', fr: 'cerf-volant', e: '🪁', a: 'a' },
    { id: 'robot', en: 'robot', fr: 'robot', e: '🤖', a: 'a' },
    { id: 'balloon', en: 'balloon', fr: 'ballon de baudruche', e: '🎈', a: 'a' },
  ]},
  { id: 'shapes', fr: 'Les formes', en: 'Shapes', icon: '⭐', bg: '#E4F7F5', tpl: "It's {a} {w}.", items: [
    { id: 'circle', en: 'circle', fr: 'rond', shape: 'circle', a: 'a' },
    { id: 'square', en: 'square', fr: 'carré', shape: 'square', a: 'a' },
    { id: 'triangle', en: 'triangle', fr: 'triangle', shape: 'triangle', a: 'a' },
    { id: 'star', en: 'star', fr: 'étoile', shape: 'star', a: 'a' },
    { id: 'heart', en: 'heart', fr: 'cœur', shape: 'heart', a: 'a' },
    { id: 'rectangle', en: 'rectangle', fr: 'rectangle', shape: 'rectangle', a: 'a' },
  ]},
  { id: 'weather', fr: 'La météo', en: 'Weather', icon: '🌦️', bg: '#D6EEFF', tpl: "It's {w}.", items: [
    { id: 'sunny', en: 'sunny', fr: 'il fait beau', e: '☀️' },
    { id: 'rainy', en: 'rainy', fr: 'il pleut', e: '🌧️' },
    { id: 'cloudy', en: 'cloudy', fr: 'nuageux', e: '☁️' },
    { id: 'windy', en: 'windy', fr: 'il y a du vent', e: '🌬️' },
    { id: 'snowy', en: 'snowy', fr: 'il neige', e: '❄️' },
    { id: 'hot', en: 'hot', fr: 'il fait chaud', e: '🥵' },
    { id: 'cold', en: 'cold', fr: 'il fait froid', e: '🥶' },
  ]},
  { id: 'feelings', fr: 'Les émotions', en: 'Feelings', icon: '😀', bg: '#FFF0B3', tpl: "I'm {w}.", items: [
    { id: 'happy', en: 'happy', fr: 'content', e: '😀' },
    { id: 'sad', en: 'sad', fr: 'triste', e: '😢' },
    { id: 'angry', en: 'angry', fr: 'en colère', e: '😠' },
    { id: 'tired', en: 'tired', fr: 'fatigué', e: '😴' },
    { id: 'scared', en: 'scared', fr: 'qui a peur', e: '😱' },
    { id: 'hungry', en: 'hungry', fr: 'qui a faim', e: '😋' },
  ]},
  { id: 'abc', fr: "L'alphabet", en: 'ABC', icon: '🔤', bg: '#EDE4FF', tpl: "It's {w}.", items: [
    ['A', 'ay', 'apple', '🍎'], ['B', 'bee', 'ball', '⚽'], ['C', 'see', 'cat', '🐱'], ['D', 'dee', 'dog', '🐶'],
    ['E', 'ee', 'egg', '🥚'], ['F', 'eff', 'fish', '🐟'], ['G', 'jee', 'grapes', '🍇'], ['H', 'aitch', 'hat', '👒'],
    ['I', 'eye', 'ice cream', '🍦'], ['J', 'jay', 'juice', '🧃'], ['K', 'kay', 'kite', '🪁'], ['L', 'ell', 'lion', '🦁'],
    ['M', 'em', 'monkey', '🐵'], ['N', 'en', 'nose', '👃'], ['O', 'oh', 'orange', '🍊'], ['P', 'pee', 'pig', '🐷'],
    ['Q', 'cue', 'queen', '👸'], ['R', 'are', 'rabbit', '🐰'], ['S', 'ess', 'sun', '☀️'], ['T', 'tee', 'teddy bear', '🧸'],
    ['U', 'you', 'umbrella', '☂️'], ['V', 'vee', 'van', '🚐'], ['W', 'double you', 'water', '💧'], ['X', 'ex', 'fox', '🦊'],
    ['Y', 'why', 'yo-yo', '🪀'], ['Z', 'zed', 'zebra', '🦓'],
  ].map(([L, say, word, e]) => ({ id: 'l' + L, en: L, say, fr: L, big: L, ex: word, exE: e })) },
];

const ITEM = {};
THEMES.forEach(t => t.items.forEach(it => { it.theme = t.id; ITEM[t.id + ':' + it.id] = it; }));
const item = key => ITEM[key];

/* ---------- Histoires ---------- */
const STORIES = [
  { id: 'breakfast', title: "Bloop's Breakfast", fr: 'Le petit-déjeuner de Bloop', cover: '🍎', theme: 'food', pages: [
    { s: '🌅🏠', en: 'Good morning, Bloop!', fr: 'Bonjour, Bloop !' },
    { s: '😋', en: 'Bloop is hungry.', fr: 'Bloop a faim.' },
    { s: '🍎', en: 'Bloop has an apple. Yum!', fr: 'Bloop a une pomme. Miam !' },
    { s: '🍌', en: 'Bloop has a banana. Yum yum!', fr: 'Bloop a une banane. Miam miam !' },
    { s: '🥛', en: 'Bloop has some milk.', fr: 'Bloop a du lait.' },
    { s: '🎂❓', en: 'A cake? No, Bloop! Not for breakfast!', fr: 'Un gâteau ? Non, Bloop ! Pas au petit-déjeuner !' },
    { s: '😀💛', en: 'Bloop is happy. Thank you, Mum!', fr: 'Bloop est content. Merci, maman !' },
  ], quiz: [
    { en: 'What does Bloop eat first?', fr: "Qu'est-ce que Bloop mange en premier ?", ok: 'food:apple', opts: ['food:apple', 'food:pizza', 'food:egg'] },
    { en: 'Is Bloop happy or sad?', fr: 'Bloop est content ou triste ?', ok: 'feelings:happy', opts: ['feelings:happy', 'feelings:sad'] },
  ]},
  { id: 'kiki', title: 'Kiki the Colour Cat', fr: 'Kiki, le chat de toutes les couleurs', cover: '🐱', theme: 'colours', pages: [
    { s: '🐱', en: 'This is Kiki. Kiki is a cat.', fr: "Voici Kiki. Kiki est un chat." },
    { s: '🐱❤️', en: 'Kiki jumps in red paint. Now Kiki is red!', fr: 'Kiki saute dans la peinture rouge. Kiki est rouge !' },
    { s: '🐱💙', en: 'Kiki jumps in blue paint. Now Kiki is blue!', fr: 'Kiki saute dans la peinture bleue. Kiki est bleu !' },
    { s: '🐱💛', en: 'Kiki jumps in yellow paint. Now Kiki is yellow!', fr: 'Kiki saute dans la peinture jaune. Kiki est jaune !' },
    { s: '🛁🫧', en: 'Bath time, Kiki!', fr: "C'est l'heure du bain, Kiki !" },
    { s: '🐱🤍', en: 'Now Kiki is white again. Meow!', fr: 'Kiki est de nouveau blanc. Miaou !' },
  ], quiz: [
    { en: 'What colour is Kiki first?', fr: 'De quelle couleur est Kiki en premier ?', ok: 'colours:red', opts: ['colours:red', 'colours:blue', 'colours:green'] },
    { en: 'What animal is Kiki?', fr: 'Quel animal est Kiki ?', ok: 'animals:cat', opts: ['animals:dog', 'animals:cat', 'animals:fish'] },
  ]},
  { id: 'ball', title: 'Where Is My Ball?', fr: 'Où est mon ballon ?', cover: '⚽', theme: 'toys', pages: [
    { s: '👧⚽', en: 'Mia has a ball.', fr: 'Mia a un ballon.' },
    { s: '👧❓', en: 'But where is it?', fr: 'Mais où est-il ?' },
    { s: '🛏️', en: 'Is it under the bed? No!', fr: 'Sous le lit ? Non !' },
    { s: '📦', en: 'Is it in the box? No!', fr: 'Dans la boîte ? Non !' },
    { s: '🎒', en: 'Is it in the bag? No!', fr: 'Dans le cartable ? Non !' },
    { s: '🐶⚽', en: 'Look! The dog has the ball!', fr: 'Regarde ! Le chien a le ballon !' },
    { s: '😂🐶👧', en: "Silly dog! Let's play!", fr: 'Coquin de chien ! On joue !' },
  ], quiz: [
    { en: 'Who has the ball?', fr: 'Qui a le ballon ?', ok: 'animals:dog', opts: ['animals:cat', 'animals:bird', 'animals:dog'] },
    { en: 'What is Mia looking for?', fr: 'Que cherche Mia ?', ok: 'toys:ball', opts: ['toys:ball', 'toys:kite', 'toys:doll'] },
  ]},
  { id: 'rainy', title: 'Tom and the Weather', fr: 'Tom et la météo', cover: '🌦️', theme: 'weather', pages: [
    { s: '☀️🧢', en: "It's sunny. Tom has a cap.", fr: 'Il fait beau. Tom a une casquette.' },
    { s: '☁️', en: "Oh! It's cloudy.", fr: 'Oh ! Il y a des nuages.' },
    { s: '🌧️🧥', en: "Now it's rainy! Tom needs a coat.", fr: 'Maintenant il pleut ! Tom a besoin d’un manteau.' },
    { s: '❄️🧣🧤', en: "Brrr! It's snowy! Tom needs a scarf and gloves.", fr: 'Brrr ! Il neige ! Tom a besoin d’une écharpe et de gants.' },
    { s: '⛄😀', en: 'Tom makes a snowman. He is happy!', fr: 'Tom fait un bonhomme de neige. Il est content !' },
  ], quiz: [
    { en: "What's the weather at the start?", fr: 'Quel temps fait-il au début ?', ok: 'weather:sunny', opts: ['weather:snowy', 'weather:sunny', 'weather:rainy'] },
    { en: 'It is rainy. What does Tom need?', fr: 'Il pleut. De quoi Tom a besoin ?', ok: 'clothes:coat', opts: ['clothes:coat', 'clothes:sock', 'clothes:hat'] },
  ]},
  { id: 'family', title: 'My Family', fr: 'Ma famille', cover: '👨‍👩‍👧‍👦', theme: 'family', pages: [
    { s: '🏠', en: 'This is my house.', fr: 'Voici ma maison.' },
    { s: '👨', en: 'This is my dad. He is tall.', fr: 'Voici mon papa. Il est grand.' },
    { s: '👩', en: 'This is my mum. She is funny.', fr: 'Voici ma maman. Elle est rigolote.' },
    { s: '👦', en: 'This is my brother. He is little.', fr: 'Voici mon frère. Il est petit.' },
    { s: '👵👴', en: 'This is my grandma and my grandpa.', fr: 'Voici ma mamie et mon papi.' },
    { s: '👨‍👩‍👧‍👦❤️', en: 'I love my family!', fr: "J'aime ma famille !" },
  ], quiz: [
    { en: 'Who is little?', fr: 'Qui est petit ?', ok: 'family:brother', opts: ['family:dad', 'family:brother', 'family:grandpa'] },
    { en: 'Who is funny?', fr: 'Qui est rigolote ?', ok: 'family:mum', opts: ['family:mum', 'family:grandma', 'family:baby'] },
  ]},
  { id: 'ducks', title: 'Little Ducks', fr: 'Les petits canards', cover: '🦆', theme: 'numbers', pages: [
    { s: '🦆', en: 'One little duck. Quack!', fr: 'Un petit canard. Coin !' },
    { s: '🦆🦆', en: 'Two little ducks. Quack, quack!', fr: 'Deux petits canards. Coin, coin !' },
    { s: '🦆🦆🦆', en: 'Three little ducks.', fr: 'Trois petits canards.' },
    { s: '🦆🦆🦆🦆', en: 'Four little ducks.', fr: 'Quatre petits canards.' },
    { s: '🦆🦆🦆🦆🦆', en: 'Five little ducks swim in the water.', fr: "Cinq petits canards nagent dans l'eau." },
    { s: '❓🦆', en: 'Where is Mummy Duck?', fr: 'Où est Maman Canard ?' },
    { s: '🦆🦆🦆🦆🦆🦢', en: 'Here she is! Six ducks! Quack!', fr: 'La voilà ! Six canards ! Coin !' },
  ], quiz: [
    { en: 'How many ducks at the end?', fr: 'Combien de canards à la fin ?', ok: 'numbers:n6', opts: ['numbers:n3', 'numbers:n6', 'numbers:n5'] },
    { en: 'What do ducks say?', fr: 'Que disent les canards ?', ok: 'animals:duck', opts: ['animals:cow', 'animals:duck', 'animals:dog'], hint: 'Quack!' },
  ]},
  { id: 'dance', title: "Bloop's Dance", fr: 'La danse de Bloop', cover: '💃', theme: 'body', pages: [
    { s: '🎵💃', en: 'Bloop loves to dance!', fr: 'Bloop adore danser !' },
    { s: '🙂', en: 'Bloop moves his head.', fr: 'Bloop bouge sa tête.' },
    { s: '✋✋', en: 'Bloop claps his hands. Clap, clap!', fr: 'Bloop tape dans ses mains. Clap, clap !' },
    { s: '🦶🦶', en: 'Bloop stamps his feet. Boom, boom!', fr: 'Bloop tape des pieds. Boum, boum !' },
    { s: '👃', en: 'Bloop touches his nose.', fr: 'Bloop touche son nez.' },
    { s: '😴', en: 'Now Bloop is tired. Good night, Bloop!', fr: 'Maintenant Bloop est fatigué. Bonne nuit, Bloop !' },
  ], quiz: [
    { en: 'What does Bloop move first?', fr: "Qu'est-ce que Bloop bouge en premier ?", ok: 'body:head', opts: ['body:foot', 'body:head', 'body:hand'] },
    { en: 'How is Bloop at the end?', fr: 'Comment est Bloop à la fin ?', ok: 'feelings:tired', opts: ['feelings:tired', 'feelings:angry', 'feelings:scared'] },
  ]},
];

/* ---------- Dialogues (jeu de rôle) ---------- */
// who: bloop | pip | kid. {name} {age} {choice} sont remplacés.
const DIALOGUES = [
  { id: 'meet', title: 'Hello!', fr: 'Se présenter', icon: '👋', theme: 'hello', lines: [
    { who: 'bloop', en: "Hello! I'm Bloop. What's your name?", fr: "Bonjour ! Je suis Bloop. Comment tu t'appelles ?" },
    { who: 'kid', en: 'Hello! My name is {name}.', fr: "Bonjour ! Je m'appelle {name}." },
    { who: 'bloop', en: 'Nice to meet you, {name}!', fr: 'Enchanté, {name} !' },
    { who: 'kid', en: 'Nice to meet you too!', fr: 'Enchanté{e} aussi !' },
  ]},
  { id: 'howareyou', title: 'How are you?', fr: 'Comment ça va ?', icon: '😀', theme: 'feelings', lines: [
    { who: 'bloop', en: 'How are you today?', fr: "Comment ça va aujourd'hui ?" },
    { who: 'kid', choices: [
      { en: "I'm fine, thank you!", fr: 'Ça va bien, merci !', e: '😀' },
      { en: "I'm tired.", fr: 'Je suis fatigué{e}.', e: '😴' },
      { en: "I'm hungry!", fr: "J'ai faim !", e: '😋' },
    ]},
    { who: 'bloop', en: 'Oh, I see! Thank you for telling me.', fr: 'Ah, je vois ! Merci de me le dire.' },
    { who: 'kid', en: 'And you, Bloop?', fr: 'Et toi, Bloop ?' },
    { who: 'bloop', en: "I'm very happy! Yippee!", fr: 'Je suis très content ! Youpi !' },
  ]},
  { id: 'age', title: 'How old are you?', fr: 'Quel âge as-tu ?', icon: '🎂', theme: 'numbers', lines: [
    { who: 'pip', en: 'Hi! How old are you?', fr: 'Salut ! Quel âge as-tu ?' },
    { who: 'kid', en: "I'm {age}.", fr: "J'ai {agefr} ans." },
    { who: 'pip', en: 'Wow, {age}! I am two!', fr: 'Waouh, {agefr} ! Moi j’ai deux ans !' },
    { who: 'kid', en: "Happy birthday, Pip!", fr: 'Joyeux anniversaire, Pip !' },
    { who: 'pip', en: 'Thank you!', fr: 'Merci !' },
  ]},
  { id: 'colour', title: 'My favourite colour', fr: 'Ma couleur préférée', icon: '🎨', theme: 'colours', lines: [
    { who: 'bloop', en: "What's your favourite colour?", fr: 'Quelle est ta couleur préférée ?' },
    { who: 'kid', choices: [
      { en: 'My favourite colour is pink.', fr: 'Ma couleur préférée est le rose.', c: '#F48FB1', v: 'pink' },
      { en: 'My favourite colour is purple.', fr: 'Ma couleur préférée est le violet.', c: '#8E24AA', v: 'purple' },
      { en: 'My favourite colour is blue.', fr: 'Ma couleur préférée est le bleu.', c: '#1E88E5', v: 'blue' },
      { en: 'My favourite colour is yellow.', fr: 'Ma couleur préférée est le jaune.', c: '#FDD835', v: 'yellow' },
    ]},
    { who: 'bloop', en: '{choice}? I love {choice} too!', fr: "Moi aussi j'adore cette couleur !" },
  ]},
  { id: 'snack', title: 'Snack time', fr: "L'heure du goûter", icon: '🍌', theme: 'food', lines: [
    { who: 'pip', en: 'Are you hungry?', fr: 'Tu as faim ?' },
    { who: 'kid', en: 'Yes, please!', fr: "Oui, s'il te plaît !" },
    { who: 'pip', en: 'An apple or a banana?', fr: 'Une pomme ou une banane ?' },
    { who: 'kid', choices: [
      { en: 'An apple, please.', fr: "Une pomme, s'il te plaît.", e: '🍎' },
      { en: 'A banana, please.', fr: "Une banane, s'il te plaît.", e: '🍌' },
    ]},
    { who: 'pip', en: 'Here you are!', fr: 'Tiens !' },
    { who: 'kid', en: 'Thank you!', fr: 'Merci !' },
    { who: 'pip', en: "You're welcome!", fr: 'De rien !' },
  ]},
  { id: 'teddy', title: 'Lost teddy', fr: 'Le nounours perdu', icon: '🧸', theme: 'toys', lines: [
    { who: 'pip', en: "Oh no! I'm sad.", fr: 'Oh non ! Je suis triste.' },
    { who: 'kid', en: 'Why are you sad?', fr: 'Pourquoi tu es triste ?' },
    { who: 'pip', en: "I can't find my teddy bear.", fr: 'Je ne trouve pas mon nounours.' },
    { who: 'kid', en: "Look! It's here!", fr: "Regarde ! Il est là !" },
    { who: 'pip', en: "Thank you! Now I'm happy!", fr: 'Merci ! Maintenant je suis content !' },
  ]},
  { id: 'bye', title: 'Goodbye!', fr: 'Au revoir !', icon: '🚌', theme: 'hello', lines: [
    { who: 'bloop', en: "It's time to go. Goodbye, {name}!", fr: "C'est l'heure de partir. Au revoir, {name} !" },
    { who: 'kid', en: 'Goodbye, Bloop! See you tomorrow!', fr: 'Au revoir, Bloop ! À demain !' },
    { who: 'bloop', en: 'See you tomorrow! Bye bye!', fr: 'À demain ! Salut salut !' },
  ]},
];

/* ---------- Bouge avec Bloop ---------- */
const MOVES = [
  { en: 'Jump!', fr: 'Saute !', e: '🦘' },
  { en: 'Clap your hands!', fr: 'Tape dans tes mains !', e: '👏' },
  { en: 'Touch your nose!', fr: 'Touche ton nez !', e: '👃' },
  { en: 'Touch your head!', fr: 'Touche ta tête !', e: '🙆' },
  { en: 'Turn around!', fr: 'Tourne sur toi-même !', e: '🔄' },
  { en: 'Wave your hand!', fr: 'Fais coucou de la main !', e: '👋' },
  { en: 'Stamp your feet!', fr: 'Tape des pieds !', e: '🦶' },
  { en: 'Sit down!', fr: 'Assieds-toi !', e: '🪑' },
  { en: 'Stand up!', fr: 'Lève-toi !', e: '🧍' },
  { en: 'Dance!', fr: 'Danse !', e: '💃' },
  { en: 'Shake your body!', fr: 'Secoue-toi !', e: '🕺' },
  { en: 'Touch your toes!', fr: 'Touche tes pieds !', e: '🙇' },
  { en: 'Hop on one foot!', fr: 'Saute sur un pied !', e: '🦩' },
  { en: 'Fly like a bird!', fr: 'Vole comme un oiseau !', e: '🐦' },
  { en: 'Roar like a lion!', fr: 'Rugis comme un lion !', e: '🦁' },
  { en: 'Swim like a fish!', fr: 'Nage comme un poisson !', e: '🐟' },
];

/* ---------- Autocollants (1 tous les 5 étoiles) ---------- */
const STICKERS = ['🦄','🐉','🦖','🚀','🌈','🐼','🦋','🐬','🍩','🎠','🧁','🐙','🦊','🐨','🌻','🍭','🪐','🐢','🦜','🐞',
  '🏰','🎪','🐳','🦒','🍉','⛵','🎸','🐧','🦔','🌟','🐯','🎡','🍓','🦀','🐸','🧜‍♀️','🦚','🎈','🐲','👑'];

const PRAISE = ['Great job!', 'Well done!', 'Super!', 'Excellent!', 'Fantastic!', 'Brilliant!', 'Yes! Good job!', 'Amazing!'];
const RETRY_FR = ['Oups ! Essaie encore.', 'Presque ! Encore une fois.', 'Pas tout à fait. Écoute bien !'];
const RETRY_EN = ['Oops! Try again.', 'Almost! Try again.', 'Listen again!'];
const NUM_WORDS = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
const AVATARS = ['🦄','🐱','🐶','🦊','🐼','🐰','🐯','🐸','🦁','🐨','🐵','🐧'];
