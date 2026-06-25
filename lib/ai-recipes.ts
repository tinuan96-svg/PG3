export interface Recipe {
  name: string
  description: string
  ingredients: RecipeIngredient[]
  servings: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  time: string
}

export interface RecipeIngredient {
  name: string
  quantity: string
  searchTerms: string[]
}

export const recipeDatabase: Recipe[] = [
  {
    name: 'Kerala Fish Curry',
    description: 'Classic tangy fish curry with coconut and kokum',
    servings: 4,
    difficulty: 'Medium',
    time: '45 min',
    ingredients: [
      { name: 'Fish Curry Powder', quantity: '2 tbsp', searchTerms: ['fish curry powder', 'fish masala', 'meen curry powder'] },
      { name: 'Coconut Oil', quantity: '3 tbsp', searchTerms: ['coconut oil', 'velichenna'] },
      { name: 'Tamarind Paste', quantity: '1 tbsp', searchTerms: ['tamarind', 'puli'] },
      { name: 'Turmeric Powder', quantity: '1 tsp', searchTerms: ['turmeric', 'manjal podi'] },
      { name: 'Chilli Powder', quantity: '1 tsp', searchTerms: ['chilli powder', 'kashmiri chilli'] },
      { name: 'Curry Leaves', quantity: '2 sprigs', searchTerms: ['curry leaves'] },
    ],
  },
  {
    name: 'Chicken Biryani',
    description: 'Fragrant layered rice with spiced chicken',
    servings: 6,
    difficulty: 'Hard',
    time: '90 min',
    ingredients: [
      { name: 'Jeerakasala Rice', quantity: '500g', searchTerms: ['jeerakasala', 'biryani rice', 'kaima rice'] },
      { name: 'Chicken Masala', quantity: '2 tbsp', searchTerms: ['chicken masala', 'biryani masala'] },
      { name: 'Garam Masala', quantity: '1 tsp', searchTerms: ['garam masala'] },
      { name: 'Ghee', quantity: '3 tbsp', searchTerms: ['ghee', 'pure ghee'] },
      { name: 'Coconut Oil', quantity: '2 tbsp', searchTerms: ['coconut oil'] },
      { name: 'Turmeric Powder', quantity: '½ tsp', searchTerms: ['turmeric'] },
    ],
  },
  {
    name: 'Vegetable Avial',
    description: 'Mixed vegetables in coconut and yoghurt gravy',
    servings: 4,
    difficulty: 'Easy',
    time: '35 min',
    ingredients: [
      { name: 'Aviyal Curry Mix', quantity: '2 tbsp', searchTerms: ['aviyal mix', 'avial masala'] },
      { name: 'Coconut Oil', quantity: '2 tbsp', searchTerms: ['coconut oil'] },
      { name: 'Turmeric Powder', quantity: '½ tsp', searchTerms: ['turmeric'] },
      { name: 'Curry Leaves', quantity: '1 sprig', searchTerms: ['curry leaves'] },
    ],
  },
  {
    name: 'Puttu with Kadala Curry',
    description: 'Steamed rice flour cylinders with chickpea curry',
    servings: 4,
    difficulty: 'Easy',
    time: '30 min',
    ingredients: [
      { name: 'Puttu Podi', quantity: '500g', searchTerms: ['puttu podi', 'puttu powder', 'chemba puttu'] },
      { name: 'Grated Coconut', quantity: '100g', searchTerms: ['coconut', 'grated coconut'] },
      { name: 'Kerala Garam Masala', quantity: '1 tsp', searchTerms: ['garam masala', 'kerala garam masala'] },
      { name: 'Coconut Oil', quantity: '2 tbsp', searchTerms: ['coconut oil'] },
    ],
  },
  {
    name: 'Kerala Sambar',
    description: 'Traditional lentil and vegetable stew',
    servings: 6,
    difficulty: 'Easy',
    time: '40 min',
    ingredients: [
      { name: 'Sambar Powder', quantity: '3 tbsp', searchTerms: ['sambar powder', 'sambar masala'] },
      { name: 'Tamarind Paste', quantity: '1 tbsp', searchTerms: ['tamarind'] },
      { name: 'Turmeric Powder', quantity: '½ tsp', searchTerms: ['turmeric'] },
      { name: 'Coconut Oil', quantity: '2 tbsp', searchTerms: ['coconut oil'] },
      { name: 'Curry Leaves', quantity: '2 sprigs', searchTerms: ['curry leaves'] },
    ],
  },
  {
    name: 'Appam with Stew',
    description: 'Lacy rice pancakes with coconut milk stew',
    servings: 6,
    difficulty: 'Medium',
    time: '60 min',
    ingredients: [
      { name: 'Appam Podi', quantity: '500g', searchTerms: ['appam podi', 'appam powder', 'appam mix'] },
      { name: 'Coconut Milk', quantity: '400ml', searchTerms: ['coconut milk'] },
      { name: 'Garam Masala', quantity: '1 tsp', searchTerms: ['garam masala'] },
      { name: 'Coconut Oil', quantity: '2 tbsp', searchTerms: ['coconut oil'] },
    ],
  },
  {
    name: 'Ada Pradhaman',
    description: 'Traditional Kerala payasam with rice ada and jaggery',
    servings: 8,
    difficulty: 'Medium',
    time: '60 min',
    ingredients: [
      { name: 'Payasam Mix', quantity: '200g', searchTerms: ['payasam mix', 'ada pradhaman mix'] },
      { name: 'Ghee', quantity: '3 tbsp', searchTerms: ['ghee', 'pure ghee'] },
      { name: 'Coconut Milk', quantity: '500ml', searchTerms: ['coconut milk'] },
      { name: 'Cardamom Powder', quantity: '½ tsp', searchTerms: ['cardamom', 'elaichi'] },
    ],
  },
  {
    name: 'Masala Dosa',
    description: 'Crispy crepe with spiced potato filling',
    servings: 4,
    difficulty: 'Medium',
    time: '45 min',
    ingredients: [
      { name: 'Dosa Podi', quantity: '500g', searchTerms: ['dosa podi', 'dosa batter', 'dosa mix'] },
      { name: 'Turmeric Powder', quantity: '½ tsp', searchTerms: ['turmeric'] },
      { name: 'Coconut Oil', quantity: '3 tbsp', searchTerms: ['coconut oil'] },
      { name: 'Sambar Powder', quantity: '1 tbsp', searchTerms: ['sambar powder'] },
    ],
  },
  {
    name: 'Kerala Egg Roast',
    description: 'Spicy egg dish in rich tomato and onion gravy',
    servings: 4,
    difficulty: 'Easy',
    time: '30 min',
    ingredients: [
      { name: 'Chilli Powder', quantity: '2 tsp', searchTerms: ['chilli powder', 'kashmiri chilli'] },
      { name: 'Turmeric Powder', quantity: '½ tsp', searchTerms: ['turmeric'] },
      { name: 'Garam Masala', quantity: '1 tsp', searchTerms: ['garam masala'] },
      { name: 'Coconut Oil', quantity: '3 tbsp', searchTerms: ['coconut oil'] },
      { name: 'Curry Leaves', quantity: '1 sprig', searchTerms: ['curry leaves'] },
    ],
  },
  {
    name: 'Weekly Grocery Essentials',
    description: 'Basic Kerala cooking essentials for the week',
    servings: 1,
    difficulty: 'Easy',
    time: 'N/A',
    ingredients: [
      { name: 'Matta Rice', quantity: '5kg', searchTerms: ['matta rice', 'rose matta', 'kerala rice'] },
      { name: 'Coconut Oil', quantity: '500ml', searchTerms: ['coconut oil'] },
      { name: 'Sambar Powder', quantity: '200g', searchTerms: ['sambar powder'] },
      { name: 'Turmeric Powder', quantity: '250g', searchTerms: ['turmeric'] },
      { name: 'Chilli Powder', quantity: '250g', searchTerms: ['chilli powder', 'kashmiri chilli'] },
      { name: 'Tea', quantity: '250g', searchTerms: ['tea', 'cardamom tea'] },
    ],
  },
]

export function findRecipeByQuery(query: string): Recipe | null {
  const q = query.toLowerCase()
  return recipeDatabase.find((r) => {
    const name = r.name.toLowerCase()
    const words = name.split(/\s+/)
    return name.includes(q) || q.includes(name) || words.some((w) => w.length > 3 && q.includes(w))
  }) || null
}

export function findRecipesByKeyword(keyword: string): Recipe[] {
  const k = keyword.toLowerCase()
  return recipeDatabase.filter((r) => {
    const haystack = `${r.name} ${r.description} ${r.ingredients.map((i) => i.name).join(' ')}`.toLowerCase()
    return haystack.includes(k)
  })
}
