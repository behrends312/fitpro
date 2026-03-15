let _stripe = null;
function getStripe() {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || !key.startsWith('sk_')) throw new Error('STRIPE_SECRET_KEY inválida ou não configurada.');
    _stripe = require('stripe')(key);
  }
  return _stripe;
}
const User = require('../models/User');

// Product IDs do Stripe Sandbox
const PLANOS = {
  basic: { productId: process.env.STRIPE_PRODUCT_BASIC, valor: 100, nome: 'Basic' },
  intermediate: { productId: process.env.STRIPE_PRODUCT_INTERMEDIATE, valor: 200, nome: 'Intermediate' },
  advanced: { productId: process.env.STRIPE_PRODUCT_ADVANCED, valor: 300, nome: 'Advanced' },
};

// Busca o price ID ativo de um produto
async function getPriceId(productId) {
  const prices = await getStripe().prices.list({ product: productId, active: true, limit: 1 });
  if (!prices.data.length) throw new Error(`Nenhum preço ativo para o produto ${productId}`);
  return prices.data[0].id;
}

// GET /stripe/planos — lista planos disponíveis
async function listarPlanos(req, res) {
  res.json([
    { id: 'trial', nome: 'Trial', valor: 0, limiteAlunos: 1, descricao: 'Gratuito, 1 aluno' },
    { id: 'basic', nome: 'Basic', valor: 1, limiteAlunos: 10, descricao: 'Até 10 alunos' },
    { id: 'intermediate', nome: 'Intermediate', valor: 2, limiteAlunos: 50, descricao: 'Até 50 alunos' },
    { id: 'advanced', nome: 'Advanced', valor: 3, limiteAlunos: null, descricao: 'Ilimitado' },
  ]);
}

// POST /stripe/checkout — cria sessão de pagamento Stripe
async function criarCheckout(req, res, next) {
  try {
    const { plano } = req.body;

    if (plano === 'trial') {
      return res.status(400).json({ message: 'Plano trial não requer pagamento.' });
    }

    const planoConfig = PLANOS[plano];
    if (!planoConfig) return res.status(400).json({ message: 'Plano inválido.' });

    const user = await User.findById(req.user.id);

    // Cria ou recupera customer no Stripe
    let customerId = user.plano?.stripeCustomerId;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email,
        name: user.nome || user.email,
        metadata: { userId: user._id.toString() },
      });
      customerId = customer.id;
    }

    const priceId = await getPriceId(planoConfig.productId);

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.APP_URL || 'http://localhost:3001'}/stripe/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:3001'}/stripe/cancelado`,
      metadata: { userId: user._id.toString(), plano },
    });

    // Salva o customerId mesmo antes de confirmar
    await User.findByIdAndUpdate(req.user.id, { 'plano.stripeCustomerId': customerId });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    next(err);
  }
}

// POST /stripe/webhook — recebe eventos do Stripe
async function webhook(req, res, next) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ message: `Webhook inválido: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, plano } = session.metadata;

        await User.findByIdAndUpdate(userId, {
          'plano.tipo': plano,
          'plano.stripeCustomerId': session.customer,
          'plano.stripeSubscriptionId': session.subscription,
          'plano.status': 'ativo',
          'plano.dataInicio': new Date(),
        });
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const customer = await getStripe().customers.retrieve(sub.customer);
        const userId = customer.metadata.userId;

        await User.findByIdAndUpdate(userId, {
          'plano.status': sub.status === 'active' ? 'ativo' : 'inativo',
          'plano.stripeSubscriptionId': sub.id,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const customer = await getStripe().customers.retrieve(sub.customer);
        const userId = customer.metadata.userId;

        await User.findByIdAndUpdate(userId, {
          'plano.tipo': 'trial',
          'plano.status': 'cancelado',
          'plano.stripeSubscriptionId': null,
        });
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}

// POST /stripe/cancelar — personal cancela assinatura
async function cancelarAssinatura(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user.plano?.stripeSubscriptionId) {
      return res.status(400).json({ message: 'Nenhuma assinatura ativa.' });
    }

    await getStripe().subscriptions.cancel(user.plano.stripeSubscriptionId);

    await User.findByIdAndUpdate(req.user.id, {
      'plano.tipo': 'trial',
      'plano.status': 'cancelado',
      'plano.stripeSubscriptionId': null,
    });

    res.json({ message: 'Assinatura cancelada com sucesso.' });
  } catch (err) {
    next(err);
  }
}

// GET /stripe/assinatura — status da assinatura do personal
async function minhaAssinatura(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('plano nome email');

    let stripeData = null;
    if (user.plano?.stripeSubscriptionId) {
      stripeData = await getStripe().subscriptions.retrieve(user.plano.stripeSubscriptionId);
    }

    res.json({ plano: user.plano, stripe: stripeData });
  } catch (err) {
    next(err);
  }
}

module.exports = { listarPlanos, criarCheckout, webhook, cancelarAssinatura, minhaAssinatura };
