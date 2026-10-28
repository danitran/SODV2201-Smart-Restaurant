/**
 * aiDataset.js — the knowledge of the simulated AI assistant.
 *
 * Assignment 1, AI feature, Option 2 ("Simulate the AI locally"): the six
 * question/response pairs below are copied exactly from the assignment brief.
 * `keywords` let the assistant recognise other ways of asking the same thing
 * ("veggie options?", "anything gluten free?").
 *
 * Some answers are personalised at run time by aiService.js from real data
 * (today's special, the most popular dessert, the customer's last order).
 * With the starting data those answers are word-for-word the brief's
 * responses; they change when the admin changes the special or new orders
 * come in.
 *
 * keyword scoring: a keyword with N words is worth N points, so phrases like
 * "gluten free" count more than single words. `priority` breaks ties: a more
 * specific topic (dessert) beats a general one (recommend).
 */

export const BRIEF_DATASET = [
  {
    id: 'todays-special',
    question: "What are today's specials?",
    response: "Today's special is Chicken Alfredo for $18.99.",
    keywords: ['special', 'specials', 'today', 'tonight', 'deal', 'deals', 'chef special'],
    priority: 2,
  },
  {
    id: 'vegetarian',
    question: 'What vegetarian meals do you have?',
    response: 'We offer Vegetable Pasta, Margherita Pizza, and Garden Salad.',
    keywords: ['vegetarian', 'veggie', 'veg', 'meatless', 'no meat', 'without meat', 'plant based'],
    itemIds: ['vegetable-pasta', 'margherita-pizza', 'garden-salad'],
    priority: 3,
  },
  {
    id: 'recommend',
    question: 'What do you recommend?',
    response: 'Based on popular orders, we recommend our Chicken Alfredo.',
    keywords: ['recommend', 'recommendation', 'recommendations', 'suggest', 'suggestion', 'what should i', 'should i order', 'should i get', 'popular', 'best dish', 'favourite', 'favorite', 'signature'],
    priority: 1,
  },
  {
    id: 'gluten-free',
    question: 'Do you have gluten-free options?',
    response: 'Yes. We offer gluten-free pasta and selected salads.',
    keywords: ['gluten', 'gluten free', 'celiac', 'coeliac', 'gf', 'wheat free'],
    itemIds: ['gf-penne-bolognese', 'garden-salad'],
    link: { to: '/menu?diet=gluten-free', label: 'See all gluten-free dishes' },
    priority: 3,
  },
  {
    id: 'popular-dessert',
    question: 'What is the most popular dessert?',
    response: 'Our Chocolate Lava Cake is our most popular dessert.',
    keywords: ['dessert', 'desserts', 'popular dessert', 'sweet', 'sweets', 'cake'],
    priority: 3,
  },
  {
    id: 'last-order',
    question: 'What did I order last time?',
    response: 'Your previous order was Chicken Alfredo and Chocolate Lava Cake.',
    keywords: ['last time', 'last order', 'previous order', 'ordered before', 'order history', 'what did i order', 'my usual', 'same as last'],
    priority: 4,
  },
]

/** Extra everyday questions so the assistant is useful beyond the six samples. */
export const EXTRA_INTENTS = [
  { id: 'greeting', keywords: ['hi', 'hello', 'hey', 'good morning', 'good evening', 'good afternoon'], priority: 0 },
  { id: 'thanks', keywords: ['thanks', 'thank you', 'thx', 'cheers'], priority: 0 },
  { id: 'hours', keywords: ['hours', 'open', 'opening', 'close', 'closing', 'closed', 'what time'], priority: 2 },
  { id: 'location', keywords: ['where are you', 'address', 'location', 'located', 'parking', 'directions', 'phone number', 'call you'], priority: 2 },
  { id: 'delivery', keywords: ['delivery', 'deliver', 'pickup', 'pick up', 'take out', 'takeout', 'delivery fee'], priority: 2 },
  { id: 'reservation', keywords: ['book', 'booking', 'reserve', 'reservation', 'table', 'birthday', 'party', 'event', 'corporate', 'anniversary'], priority: 2 },
  { id: 'vegan', keywords: ['vegan', 'plant only', 'no animal'], priority: 4 },
  { id: 'dairy-free', keywords: ['dairy', 'dairy free', 'lactose', 'milk free'], priority: 4 },
  { id: 'order-status', keywords: ['where is my order', 'where s my order', 'order status', 'track', 'tracking', 'my order ready', 'how long'], priority: 4 },
  { id: 'allergy', keywords: ['allergy', 'allergies', 'allergic', 'nut', 'nuts', 'peanut', 'shellfish'], priority: 5 },
]

/** Quick-reply chips shown in the chat: the brief's six sample questions. */
export const SUGGESTED_QUESTIONS = BRIEF_DATASET.map((entry) => entry.question)
