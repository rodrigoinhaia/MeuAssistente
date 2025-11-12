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
    <main className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 flex flex-col items-center overflow-x-hidden">
      {/* Header fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-icon.svg" alt="MeuAssistente" className="w-10 h-10" />
            <span className="text-xl font-extrabold bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 bg-clip-text text-transparent tracking-tight">
              MeuAssistente
            </span>
          </div>
          <Link href="/login">
            <button className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-xl shadow-md shadow-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/30 transition-all">
              Entrar
            </button>
          </Link>
        </div>
      </header>

      {/* Fundo decorativo */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-cyan-200/40 to-teal-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-gradient-to-br from-blue-100/20 to-cyan-100/20 rounded-full blur-3xl" />
      </div>

      {/* HERO */}
      <section className="z-10 w-full max-w-6xl px-4 md:px-8 pt-32 pb-16 md:pt-40 md:pb-24 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-50 to-emerald-50 border border-cyan-200/60 rounded-full mb-6 shadow-sm">
          <span className="text-sm font-semibold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">
            🎁 3 dias grátis para testar
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
          <span className="bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
            Controle total
          </span>
          <br />
          <span className="text-slate-800">das suas finanças</span>
          <br />
          <span className="text-slate-700">e compromissos</span>
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
          Tenha um <span className="font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">assistente pessoal 24h</span> que organiza sua vida financeira e compromissos direto no <span className="font-semibold text-emerald-600">WhatsApp</span> e no <span className="font-semibold text-cyan-600">painel web</span>.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-12">
          <Link href="/register">
            <button className="px-8 py-4 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-white rounded-xl text-lg font-bold shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all transform hover:scale-105">
              Começar grátis agora
            </button>
          </Link>
          <Link href="/login">
            <button className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-lg font-semibold hover:border-cyan-300 hover:text-cyan-600 transition-all">
              Já tenho conta
            </button>
          </Link>
        </div>
        <div className="flex flex-wrap gap-3 justify-center max-w-4xl">
          <span className="bg-white/80 backdrop-blur-sm border border-cyan-100 text-cyan-700 px-4 py-2 rounded-full font-semibold shadow-sm text-sm">💼 Gestão Financeira Inteligente</span>
          <span className="bg-white/80 backdrop-blur-sm border border-teal-100 text-teal-700 px-4 py-2 rounded-full font-semibold shadow-sm text-sm">📅 Compromissos & Agenda</span>
          <span className="bg-white/80 backdrop-blur-sm border border-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-semibold shadow-sm text-sm">💬 WhatsApp & IA</span>
          <span className="bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-700 px-4 py-2 rounded-full font-semibold shadow-sm text-sm">👥 Multitenancy</span>
          <span className="bg-white/80 backdrop-blur-sm border border-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold shadow-sm text-sm">🌐 Painel Web & Google</span>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="z-10 w-full max-w-6xl px-4 md:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Como funciona
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Simples, rápido e inteligente. Em 3 passos você tem controle total
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8 flex flex-col items-center hover:shadow-xl hover:scale-105 transition-all group">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="text-3xl">💬</span>
            </div>
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-full flex items-center justify-center font-bold mb-4">
              1
            </div>
            <h3 className="font-bold text-xl mb-3 text-slate-800">Envie mensagem no WhatsApp</h3>
            <p className="text-slate-600 text-center leading-relaxed">
              Registre receitas, despesas e compromissos de forma simples, por texto ou áudio. Natural como conversar com um amigo.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8 flex flex-col items-center hover:shadow-xl hover:scale-105 transition-all group">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="text-3xl">🤖</span>
            </div>
            <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-full flex items-center justify-center font-bold mb-4">
              2
            </div>
            <h3 className="font-bold text-xl mb-3 text-slate-800">IA organiza tudo pra você</h3>
            <p className="text-slate-600 text-center leading-relaxed">
              O sistema entende, categoriza e registra automaticamente, enviando lembretes e insights personalizados em tempo real.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8 flex flex-col items-center hover:shadow-xl hover:scale-105 transition-all group">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="text-3xl">📊</span>
            </div>
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full flex items-center justify-center font-bold mb-4">
              3
            </div>
            <h3 className="font-bold text-xl mb-3 text-slate-800">Acompanhe no painel web</h3>
            <p className="text-slate-600 text-center leading-relaxed">
              Visualize relatórios, gráficos, compromissos e compartilhe o acesso com sua equipe ou família.
            </p>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS E DIFERENCIAIS */}
      <section className="z-10 w-full max-w-6xl px-4 md:px-8 py-16 bg-gradient-to-br from-slate-50 to-cyan-50/30 rounded-3xl border border-slate-200/60 shadow-lg">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Por que escolher o MeuAssistente?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Tudo que você precisa para ter controle total da sua vida financeira
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: '🔒', title: 'Segurança de dados', desc: 'Criptografia de ponta a ponta e privacidade garantida' },
            { icon: '🤖', title: 'IA com 99,9% de precisão', desc: 'Tecnologia de ponta para máxima confiabilidade' },
            { icon: '🌎', title: 'Multitenancy', desc: 'Ideal para empresas e equipes de qualquer tamanho' },
            { icon: '📱', title: 'Multiplataforma', desc: 'WhatsApp, painel web e integração Google' },
            { icon: '⏰', title: 'Lembretes automáticos', desc: 'Nunca mais esqueça um compromisso ou conta' },
            { icon: '👨‍👩‍👧‍👦', title: 'Compartilhamento fácil', desc: 'Compartilhe com família ou empresa de forma segura' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-lg text-slate-800 mb-2">{item.title}</h3>
              <p className="text-slate-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ESTATÍSTICAS */}
      <section className="z-10 w-full max-w-6xl px-4 md:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: '📈', value: '+150 mil', label: 'Registros processados', color: 'from-cyan-500 to-cyan-600' },
            { icon: '💰', value: '+163 milhões', label: 'Em finanças organizadas', color: 'from-emerald-500 to-emerald-600' },
            { icon: '⏰', value: '+87 mil', label: 'Compromissos lembrados', color: 'from-teal-500 to-teal-600' },
            { icon: '🤖', value: '99,9%', label: 'Precisão da IA', color: 'from-cyan-500 to-emerald-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-6 flex flex-col items-center hover:shadow-xl transition-all">
              <div className="text-4xl mb-4">{stat.icon}</div>
              <div className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                {stat.value}
              </div>
              <div className="text-slate-600 text-sm text-center font-medium">{stat.label}</div>
            </div>
          ))}
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
      <section className="z-10 w-full max-w-6xl px-4 md:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Clientes que transformaram sua rotina
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Veja o que nossos usuários estão dizendo
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8 flex flex-col hover:shadow-xl transition-all">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, idx) => (
                  <span key={idx} className="text-yellow-400 text-xl">★</span>
                ))}
              </div>
              <p className="text-slate-700 italic mb-6 text-base leading-relaxed flex-grow">"{t.text}"</p>
              <div className="border-t border-slate-200 pt-4">
                <div className="text-sm font-semibold text-slate-800">{t.name}</div>
                <div className="text-xs text-slate-500 mt-1">{t.date}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="z-10 w-full max-w-4xl px-4 md:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Perguntas frequentes
          </h2>
          <p className="text-lg text-slate-600">
            Tire suas dúvidas sobre o MeuAssistente
          </p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="bg-white rounded-xl shadow-md border border-slate-200/60 p-6 hover:shadow-lg transition-all group">
              <summary className="font-semibold cursor-pointer text-slate-800 text-base md:text-lg group-open:text-cyan-600 transition-colors list-none flex items-center justify-between">
                <span>{faq.q}</span>
                <span className="text-cyan-500 ml-4 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-slate-600 mt-4 text-sm md:text-base leading-relaxed pl-0">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="z-10 w-full max-w-4xl px-4 md:px-8 py-20 text-center">
        <div className="bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 rounded-3xl p-12 md:p-16 shadow-2xl shadow-cyan-500/30">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            Pronto para transformar sua vida financeira?
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Experimente o MeuAssistente gratuitamente e descubra como é fácil ter controle total das suas finanças e compromissos!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link href="/register">
              <button className="px-10 py-4 bg-white text-cyan-600 rounded-xl text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                Começar grátis agora
              </button>
            </Link>
            <Link href="/login">
              <button className="px-10 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl text-lg font-semibold hover:bg-white/20 transition-all">
                Já tenho conta
              </button>
            </Link>
          </div>
        </div>
        <p className="text-slate-400 text-sm mt-8">Status: Em desenvolvimento • Versão: 0.1.0</p>
      </section>

    </main>
  )
} 