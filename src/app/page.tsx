import Link from 'next/link'
import { useMemo } from "react";

const testimonials = [
  {
    name: 'Beatriz Silva',
    date: '03/04/2025',
    text: 'Consegui pagar minhas dívidas e ainda sobra dinheiro apenas controlando as despesas!',
    rating: 5,
  },
  {
    name: 'Leonardo da Costa',
    date: '02/04/2025',
    text: 'Me ajuda a lembrar de tudo e ser organizado sem muito trabalho.',
    rating: 5,
  },
  {
    name: 'Amanda Cardoso',
    date: '01/04/2025',
    text: 'Simples, visual e direto ao ponto.',
    rating: 5,
  },
]

const faqs = [
  {
    q: 'Meus dados estão seguros?',
    a: 'Sim. Utilizamos criptografia de ponta a ponta e servidores seguros. Nenhuma informação é compartilhada com terceiros.'
  },
  {
    q: 'Preciso de conhecimento técnico?',
    a: 'Não! O MeuAssistente foi criado para ser usado por qualquer pessoa, mesmo sem experiência em finanças.'
  },
  {
    q: 'Posso compartilhar com minha família ou empresa?',
    a: 'Sim! O sistema suporta múltiplos usuários e perfis, ideal para famílias e empresas.'
  },
  {
    q: 'Como funciona a integração com Google?',
    a: 'Você pode sincronizar compromissos e tarefas automaticamente com Google Agenda e Google Tasks.'
  },
  {
    q: 'Consigo acessar pelo WhatsApp e pelo painel web?',
    a: 'Sim! Você pode interagir via WhatsApp e acessar relatórios completos no painel web.'
  },
]

const tags = [
  'Paguei 30 reais de gasolina',
  'Recebi 10 mil reais de salário',
  'Quanto gastei hoje?',
  'Saldo do mês?',
  'Quanto tenho pra pagar esse mês?',
  'O que eu tenho pra fazer amanhã?',
  'Paguei 100 reais no mercado',
  'Tenho 2 mil reais pro aluguel dia 22',
  'Quanto gastei esse mês?',
  'Transações da semana',
  'Quando cortei o cabelo?',
  'Quanto gastei com delivery?',
  'Tenho 3 reuniões hoje?',
  'Gastei quanto em alimentação?',
  'Recebi quanto esse mês?',
  'Vou receber dia 15?',
  'Quais lembretes eu tenho hoje?',
  'Tenho saldo positivo?',
  'Quanto tenho pra receber esse mês?',
  'Registro de compromissos',
  'Quais gastos fixos tenho?',
  'Como está meu saldo?',
  'Paguei boletos hoje?',
  'Resumo financeiro do dia',
]

function getRandomPositions(count: number, width: number, height: number, tagWidth = 120, tagHeight = 32) {
  // Gera posições aleatórias dentro do container, evitando as bordas
  return Array.from({ length: count }).map(() => ({
    left: Math.random() * (width - tagWidth),
    top: Math.random() * (height - tagHeight),
  }));
}
/*
function TagCloud() {
  // Tornar responsivo: largura máxima 100vw, altura adaptável
  const width = 1200;
  const height = 360;
  const positions = useMemo(() => getRandomPositions(tags.length, width, height), []);
  return (
    <div className="absolute left-1/2 top-1/2 w-full max-w-[1200px] h-72 md:h-[360px]" style={{ transform: 'translate(-50%, -50%)' }}>
      <div className="relative w-full h-full">
        {tags.map((tag, i) => {
          const { left, top } = positions[i];
          const floatDuration = 9 + (i % 139);
          return (
            <span
              key={tag}
              className="absolute whitespace-nowrap px-3 py-1 rounded-full shadow bg-blue-50 text-blue-800 text-xs md:text-sm font-semibold animate-float"
              style={{
                left: `min(${left}px, 90vw)`,
                top: `min(${top}px, 90vw)`,
                animationDelay: `${(i % 8) * 0.3}s`,
                animationDuration: `${floatDuration}s`,
              }}
            >
              {tag}
            </span>
          );
        })}
      </div>
    </div>
  );
}
*/

export default function Home() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col items-center overflow-x-hidden">
      {/* Logo no canto superior esquerdo */}
      <div className="fixed top-3 left-2 z-50 flex items-center md:top-6 md:left-8">
        <span className="text-lg md:text-2xl font-extrabold text-blue-800 tracking-tight select-none">MeuAssistente</span>
      </div>

      {/* Botão de login fixo no canto superior direito */}
      <div className="fixed top-3 right-2 z-50 md:top-6 md:right-8">
        <Link href="/login">
          <button className="px-4 py-2 md:px-6 md:py-2 bg-white border border-blue-700 text-blue-700 font-bold rounded-lg shadow hover:bg-blue-700 hover:text-white transition-all text-sm md:text-base">
            Login
          </button>
        </Link>
      </div>

      {/* Fundo decorativo */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute -top-32 -left-32 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-blue-200 opacity-30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[200px] h-[200px] md:w-[400px] md:h-[400px] bg-purple-200 opacity-20 rounded-full blur-2xl" />
      </div>

      {/* HERO */}
      <section className="z-10 w-full max-w-2xl md:max-w-4xl px-4 md:px-6 pt-24 pb-10 text-center flex flex-col items-center">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-blue-900 mb-4 drop-shadow-lg">
          Chega de esquecer contas ou perder o controle das suas finanças!
        </h1>
        <p className="text-base md:text-xl lg:text-2xl text-gray-700 mb-8 max-w-xl md:max-w-2xl mx-auto">
          Tenha um <span className="font-bold text-blue-700">assistente pessoal 24h</span> que organiza sua vida financeira e compromissos direto no WhatsApp e no painel web.
        </p>
        <Link href="/register">
          <button className="mt-2 px-6 py-3 md:px-8 md:py-3 bg-blue-700 text-white rounded-lg text-base md:text-lg font-bold shadow-lg hover:bg-blue-800 transition-all">
            Quero experimentar grátis
          </button>
        </Link>
        <div className="flex flex-wrap gap-2 md:gap-4 justify-center mt-8 mb-2">
          <span className="bg-blue-100 text-blue-800 px-3 py-2 md:px-4 md:py-2 rounded-full font-semibold shadow text-xs md:text-base">Gestão Financeira Inteligente</span>
          <span className="bg-purple-100 text-purple-800 px-3 py-2 md:px-4 md:py-2 rounded-full font-semibold shadow text-xs md:text-base">Compromissos & Agenda</span>
          <span className="bg-green-100 text-green-800 px-3 py-2 md:px-4 md:py-2 rounded-full font-semibold shadow text-xs md:text-base">WhatsApp & IA</span>
          <span className="bg-yellow-100 text-yellow-800 px-3 py-2 md:px-4 md:py-2 rounded-full font-semibold shadow text-xs md:text-base">Multitenancy</span>
          <span className="bg-pink-100 text-pink-800 px-3 py-2 md:px-4 md:py-2 rounded-full font-semibold shadow text-xs md:text-base">Painel Web & Integração Google</span>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="z-10 w-full max-w-2xl md:max-w-5xl px-4 md:px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 flex flex-col items-center hover:scale-105 transition-transform">
          <span className="text-3xl md:text-4xl mb-2">💬</span>
          <h3 className="font-bold text-base md:text-lg mb-2 text-blue-800">1. Envie mensagem no WhatsApp</h3>
          <p className="text-gray-600 text-xs md:text-sm text-center">Registre receitas, despesas e compromissos de forma simples, por texto ou áudio.</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 flex flex-col items-center hover:scale-105 transition-transform">
          <span className="text-3xl md:text-4xl mb-2">🤖</span>
          <h3 className="font-bold text-base md:text-lg mb-2 text-purple-800">2. IA organiza tudo pra você</h3>
          <p className="text-gray-600 text-xs md:text-sm text-center">O sistema entende, categoriza e registra automaticamente, enviando lembretes e insights personalizados.</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 flex flex-col items-center hover:scale-105 transition-transform">
          <span className="text-3xl md:text-4xl mb-2">📊</span>
          <h3 className="font-bold text-base md:text-lg mb-2 text-green-800">3. Acompanhe no painel web</h3>
          <p className="text-gray-600 text-xs md:text-sm text-center">Visualize relatórios, gráficos, compromissos e compartilhe o acesso com sua equipe ou família.</p>
        </div>
      </section>

      {/* BENEFÍCIOS E DIFERENCIAIS */}
      <section className="z-10 w-full max-w-2xl md:max-w-4xl px-4 md:px-6 py-8 text-center">
        <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-2">Por que escolher o MeuAssistente?</h2>
        <ul className="flex flex-wrap justify-center gap-2 md:gap-4 text-gray-700 text-xs md:text-base mb-6">
          <li className="bg-blue-50 px-3 py-2 md:px-4 md:py-2 rounded shadow">🔒 Segurança de dados e privacidade</li>
          <li className="bg-blue-50 px-3 py-2 md:px-4 md:py-2 rounded shadow">🤖 IA com 99,9% de precisão</li>
          <li className="bg-blue-50 px-3 py-2 md:px-4 md:py-2 rounded shadow">🌎 Multitenancy: ideal para empresas e equipes</li>
          <li className="bg-blue-50 px-3 py-2 md:px-4 md:py-2 rounded shadow">📱 WhatsApp, painel web e integração Google</li>
          <li className="bg-blue-50 px-3 py-2 md:px-4 md:py-2 rounded shadow">⏰ Lembretes automáticos e relatórios inteligentes</li>
          <li className="bg-blue-50 px-3 py-2 md:px-4 md:py-2 rounded shadow">👨‍👩‍👧‍👦 Compartilhamento fácil com família ou empresa</li>
        </ul>
      </section>

      {/* ESTATÍSTICAS */}
      <section className="z-10 w-full max-w-2xl md:max-w-5xl px-4 md:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
        <div className="bg-white rounded-xl shadow p-4 md:p-6 flex flex-col items-center">
          <span className="text-2xl md:text-3xl mb-2">📈</span>
          <div className="text-lg md:text-2xl font-bold text-blue-800">+150 mil</div>
          <div className="text-gray-600 text-xs md:text-sm">Registros processados</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 md:p-6 flex flex-col items-center">
          <span className="text-2xl md:text-3xl mb-2">💰</span>
          <div className="text-lg md:text-2xl font-bold text-green-700">+163 milhões</div>
          <div className="text-gray-600 text-xs md:text-sm">Em finanças organizadas</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 md:p-6 flex flex-col items-center">
          <span className="text-2xl md:text-3xl mb-2">⏰</span>
          <div className="text-lg md:text-2xl font-bold text-purple-700">+87 mil</div>
          <div className="text-gray-600 text-xs md:text-sm">Compromissos lembrados</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 md:p-6 flex flex-col items-center">
          <span className="text-2xl md:text-3xl mb-2">🤖</span>
          <div className="text-lg md:text-2xl font-bold text-blue-700">99,9%</div>
          <div className="text-gray-600 text-xs md:text-sm">Precisão da IA</div>
        </div>
      </section>



      {/* NUVEM DE TAGS ANIMADA */}
      {/* 
      <section className="z-10 w-full max-w-2xl md:max-w-4xl px-4 md:px-6 py-12 flex flex-col items-center">
        <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-2 text-center">Interaja com o Meu Assistente 24h por dia</h2>
        <p className="text-gray-700 mb-8 text-center max-w-xl md:max-w-2xl">Pergunte o que quiser e como quiser sobre suas finanças ou compromissos. Veja alguns exemplos abaixo:</p>
        <div className="relative w-full h-60 md:h-72 flex items-center justify-center overflow-visible">
          <TagCloud />
        </div>
      </section>
      
      **/}

      {/* DEPOIMENTOS */}
      <section className="z-10 w-full max-w-2xl md:max-w-4xl px-4 md:px-6 py-8">
        <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-6 text-center">Clientes que transformaram sua rotina</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-4 md:p-6 flex flex-col items-center">
              <span className="text-yellow-400 text-lg md:text-xl mb-2">{'★'.repeat(t.rating)}</span>
              <p className="text-gray-700 italic mb-4 text-sm md:text-base">“{t.text}”</p>
              <div className="text-xs md:text-sm text-gray-500 font-semibold">{t.name}</div>
              <div className="text-xs text-gray-400">{t.date}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="z-10 w-full max-w-xl md:max-w-3xl px-4 md:px-6 py-8">
        <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-6 text-center">Perguntas frequentes</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="bg-white rounded-lg shadow p-4">
              <summary className="font-semibold cursor-pointer text-blue-800 text-sm md:text-base">{faq.q}</summary>
              <p className="text-gray-600 mt-2 text-xs md:text-sm">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="z-10 w-full max-w-md md:max-w-2xl px-4 md:px-6 py-10 text-center">
        <h2 className="text-2xl md:text-3xl font-extrabold text-blue-900 mb-4">Pronto para transformar sua vida financeira?</h2>
        <p className="text-base md:text-lg text-gray-700 mb-6">Experimente o MeuAssistente gratuitamente e descubra como é fácil ter controle total das suas finanças e compromissos!</p>
        <Link href="/register">
          <button className="px-8 py-3 md:px-10 md:py-4 bg-blue-700 text-white rounded-lg text-lg md:text-xl font-bold shadow-lg hover:bg-blue-800 transition-all">
            Quero meu assistente agora
          </button>
        </Link>
        <p className="text-gray-400 text-xs mt-4">Status: Em desenvolvimento • Versão: 0.1.0</p>
      </section>

    </main>
  )
} 