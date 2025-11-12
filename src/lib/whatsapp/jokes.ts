/**
 * Piadas e Mensagens Motivacionais
 * Com controle de frequência
 */

export const expenseJokes = [
  '💰 "O dinheiro não compra felicidade, mas compra coisas que fazem você feliz... como comida!" 😄',
  '💸 "Gastar dinheiro é fácil, difícil é ganhar de volta!" 😅',
  '🍔 "A melhor parte de gastar dinheiro é quando você esquece o que comprou!" 😂',
  '💳 "Cartão de crédito: a ferramenta que transforma 'quero' em 'tenho' instantaneamente!" 🎯',
  '🛒 "Compras: o esporte onde você sempre ganha... e seu bolso sempre perde!" 🏆',
]

export const incomeJokes = [
  '💰 "Dinheiro não cresce em árvore, mas parece que você tem uma plantação!" 🌳',
  '💵 "Receber dinheiro é como receber um abraço... só que melhor!" 🤗',
  '💸 "A melhor receita é aquela que entra na conta!" 📈',
  '🎉 "Dinheiro entrando é igual sorriso: quanto mais, melhor!" 😊',
]

export const motivationalMessages = [
  '💪 "O sucesso é a soma de pequenos esforços repetidos dia após dia!"',
  '🚀 "Cada passo que você dá te aproxima do seu objetivo!"',
  '⭐ "Você é capaz de coisas incríveis. Continue assim!"',
  '🎯 "Foco, disciplina e consistência. Essa é a fórmula!"',
  '🔥 "Grandes coisas nunca vêm de zonas de conforto!"',
]

/**
 * Seleciona uma piada aleatória baseada no tipo
 */
export function getRandomJoke(type: 'expense' | 'income'): string {
  const jokes = type === 'expense' ? expenseJokes : incomeJokes
  const randomIndex = Math.floor(Math.random() * jokes.length)
  return jokes[randomIndex]
}

/**
 * Seleciona uma mensagem motivacional aleatória
 */
export function getRandomMotivationalMessage(): string {
  const randomIndex = Math.floor(Math.random() * motivationalMessages.length)
  return motivationalMessages[randomIndex]
}

/**
 * Verifica se deve incluir piada (33% de chance)
 */
export function shouldIncludeJoke(): boolean {
  return Math.random() < 0.33
}

