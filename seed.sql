-- Dados iniciais - Assessoria Comercial UEMA Pedreiras

-- Admin (senha protegida por PBKDF2-SHA256)
INSERT OR IGNORE INTO admin_users (id, email, name, password_hash) VALUES
  (1, 'isaacferreiradias123@gmail.com', 'Isaac Ferreira Dias', '2fb609491c6922468f34e62b21f349d6:d26cddbc21075b5d41b92106549774f307591390a04105903fd1ea21b9e05177');

-- Configurações gerais
INSERT OR REPLACE INTO content (key, value) VALUES
('settings', json('{
  "companyName": "Assessoria Comercial UEMA Pedreiras",
  "shortName": "Assessoria Comercial",
  "slogan": "Organização digital para pequenos negócios",
  "description": "Soluções práticas para organizar WhatsApp, catálogo, materiais digitais e presença online de pequenos negócios em Pedreiras e região.",
  "logoUrl": "/api/media/2",
  "institutionLogoUrl": "/api/media/1",
  "faviconUrl": "/api/media/2",
  "whatsapp": "5599981687603",
  "whatsappDisplay": "(99) 98168-7603",
  "whatsappDefaultMessage": "Olá! Vim pelo site da Assessoria Comercial UEMA Pedreiras e quero organizar meu comércio.",
  "phone": "(99) 98168-7603",
  "email": "isaacferreiradias123@gmail.com",
  "address": "Pedreiras",
  "city": "Pedreiras",
  "state": "MA",
  "cep": "",
  "instagram": "",
  "facebook": "",
  "tiktok": "",
  "businessHours": "Segunda a sábado, 8h às 18h",
  "copyright": "Assessoria Comercial UEMA Pedreiras. Todos os direitos reservados."
}'));

INSERT OR REPLACE INTO content (key, value) VALUES
('topbar', json('{
  "enabled": true,
  "text": "⚡ Projeto Prático UEMA Campus Pedreiras: atendimento para estruturação comercial de pequenos negócios.",
  "linkText": "Falar agora",
  "linkEnabled": true
}'));

INSERT OR REPLACE INTO content (key, value) VALUES
('navbar', json('{
  "badge": "UEMA Pedreiras",
  "links": [
    {"label": "Gargalos", "href": "#problemas"},
    {"label": "Como Funciona", "href": "#como-funciona"},
    {"label": "Planos", "href": "#planos"},
    {"label": "Serviços", "href": "#servicos"},
    {"label": "FAQ", "href": "#faq"}
  ],
  "ctaText": "Falar no WhatsApp"
}'));

INSERT OR REPLACE INTO content (key, value) VALUES
('hero', json('{
  "enabled": true,
  "badge": "🎓 Inovação Comercial Aplicada | UEMA Pedreiras",
  "title": "Pare de perder vendas no WhatsApp. Transforme seu atendimento em um processo mais organizado e profissional.",
  "subtitle": "Organizamos o WhatsApp Business, catálogo, apresentação de produtos, materiais digitais e presença online para pequenos negócios, com soluções práticas e investimento acessível.",
  "ctaPrimary": "Organizar Meu Comércio",
  "ctaSecondary": "Ver Como Funciona",
  "mockupLabel": "Exemplo de estrutura"
}'));

INSERT OR REPLACE INTO content (key, value) VALUES
('problems', json('{
  "enabled": true,
  "title": "Seu comércio pode estar perdendo oportunidades sem perceber.",
  "subtitle": "Situações comuns no dia a dia de pequenos negócios que podem ser organizadas com as ferramentas certas."
}'));

INSERT OR REPLACE INTO content (key, value) VALUES
('authority', json('{
  "enabled": true,
  "title": "Conhecimento acadêmico aplicado ao comércio local",
  "text": "Projeto com aplicação prática de conceitos de Gestão Comercial e ferramentas digitais para apoiar a organização de pequenos negócios.",
  "detail": "Projeto de aplicação prática em Gestão Comercial desenvolvido no contexto acadêmico de Pedreiras — MA. A atuação é do projeto/serviço comercial, com identidade própria e independente da instituição.",
  "courseName": "Gestão Comercial",
  "institutionName": "Universidade Estadual do Maranhão — Campus Pedreiras"
}'));

INSERT OR REPLACE INTO content (key, value) VALUES
('servicesSection', json('{
  "enabled": true,
  "title": "O que organizamos para o seu negócio",
  "subtitle": "Serviços práticos e focados no que gera resultado para o comércio local."
}'));

INSERT OR REPLACE INTO content (key, value) VALUES
('plansSection', json('{
  "enabled": true,
  "title": "Planos com investimento acessível",
  "subtitle": "Escolha o pacote ideal para o momento do seu negócio. Preço transparente, sem surpresas."
}'));

INSERT OR REPLACE INTO content (key, value) VALUES
('stepsSection', json('{
  "enabled": true,
  "title": "Como funciona",
  "subtitle": "Um processo simples, transparente e com validação antes da entrega."
}'));

INSERT OR REPLACE INTO content (key, value) VALUES
('faqSection', json('{
  "enabled": true,
  "title": "Perguntas frequentes",
  "subtitle": "Tire suas dúvidas antes de falar com a equipe."
}'));

INSERT OR REPLACE INTO content (key, value) VALUES
('finalCta', json('{
  "enabled": true,
  "title": "Seu comércio não precisa de mais complicação. Precisa de organização.",
  "subtitle": "Comece estruturando o básico: atendimento, catálogo, apresentação e canais digitais.",
  "ctaText": "Falar com a Equipe"
}'));

INSERT OR REPLACE INTO content (key, value) VALUES
('footer', json('{
  "description": "Organização de atendimento, catálogo e presença digital para pequenos negócios de Pedreiras — MA e região.",
  "institutionalNote": "Projeto de aplicação prática em Gestão Comercial desenvolvido no contexto acadêmico de Pedreiras — MA. Serviço comercial com identidade própria, independente da instituição de ensino."
}'));

INSERT OR REPLACE INTO content (key, value) VALUES
('seo', json('{
  "title": "Assessoria Comercial UEMA Pedreiras | Organização Digital para Pequenos Negócios",
  "description": "Soluções práticas para organizar WhatsApp, catálogo, materiais digitais e presença online de pequenos negócios em Pedreiras e região.",
  "keywords": "assessoria comercial em Pedreiras, organização de WhatsApp para empresas, catálogo digital Pedreiras, presença digital para pequenos negócios, Gestão Comercial Pedreiras",
  "ogTitle": "Assessoria Comercial UEMA Pedreiras",
  "ogDescription": "Organização de WhatsApp Business, catálogo e presença digital para pequenos negócios de Pedreiras e região.",
  "ogImage": "/api/media/2",
  "canonical": ""
}'));

INSERT OR REPLACE INTO content (key, value) VALUES
('analytics', json('{
  "googleAnalyticsId": "",
  "metaPixelId": "",
  "gtmId": ""
}'));

INSERT OR REPLACE INTO content (key, value) VALUES
('whatsappWidget', json('{
  "floatingEnabled": true,
  "floatingTooltip": "Fale com a equipe",
  "mobileBarEnabled": true,
  "mobileBarText": "Falar no WhatsApp"
}'));

-- Cards de problemas
INSERT OR IGNORE INTO problem_cards (id, title, description, icon, sort_order) VALUES
  (1, 'Demora no Atendimento', 'Respostas demoradas podem fazer o cliente procurar outra opção.', 'clock', 1),
  (2, 'Digitação Repetitiva', 'Informações repetidas consomem tempo e aumentam a chance de erros.', 'keyboard', 2),
  (3, 'Apresentação Desorganizada', 'Produtos sem padrão visual podem dificultar a compreensão e a decisão de compra.', 'layout', 3),
  (4, 'Baixa Presença Digital', 'Clientes próximos podem encontrar concorrentes com maior facilidade quando as informações do negócio não estão bem organizadas online.', 'search', 4);

-- Planos
INSERT OR IGNORE INTO plans (id, name, price, billing_type, description, badge, highlighted, features, cta_text, whatsapp_message, sort_order) VALUES
  (1, 'Pacote Essencial', '130', 'Taxa única', 'Para quem precisa começar a organizar o atendimento digital e apresentar melhor seus produtos.', NULL, 0,
   json('["WhatsApp Business estruturado (horários, localização e perfil comercial)","Catálogo com até 15 produtos","Mensagens automáticas de saudação e ausência","5 respostas rápidas configuradas","Organização dos dados de pagamento","Orientação para presença no Google","Guia de uso em PDF"]'),
   'Escolher Pacote Essencial', 'Olá! Quero contratar o Pacote Essencial (R$ 130).', 1),
  (2, 'Pacote Plus Comercial', '180', 'Taxa única', 'Uma solução mais completa para melhorar a apresentação, comunicação e organização comercial do negócio.', 'Mais Vendido', 1,
   json('["Tudo do Pacote Essencial","Cardápio/tabela digital em PDF interativo","Cartão de visitas digital com botões clicáveis","Botões de PIX, GPS e Instagram","2 modelos de artes promocionais","Roteiro de atendimento para WhatsApp"]'),
   'Quero o Pacote Plus Completo', 'Olá! Quero contratar o Pacote Plus Comercial (R$ 180).', 2);

-- Serviços
INSERT OR IGNORE INTO services (id, name, description, icon, sort_order) VALUES
  (1, 'WhatsApp Business Profissional', 'Estruturação completa do perfil comercial: horários, localização, catálogo, mensagens automáticas e respostas rápidas.', 'message-circle', 1),
  (2, 'Catálogo e Cardápio Digital', 'Apresentação organizada dos seus produtos com fotos, preços e descrições que facilitam a decisão de compra.', 'book-open', 2),
  (3, 'Cartão de Visitas Digital', 'Um link único com botões clicáveis para WhatsApp, PIX, localização e redes sociais do seu negócio.', 'id-card', 3),
  (4, 'Materiais Promocionais', 'Artes digitais organizadas para divulgar promoções e novidades com padrão visual profissional.', 'palette', 4),
  (5, 'Presença no Google', 'Orientação para que clientes próximos encontrem seu negócio com informações corretas e atualizadas.', 'map-pin', 5),
  (6, 'Roteiro de Atendimento', 'Sequência prática de mensagens para conduzir o cliente do primeiro contato ao fechamento da venda.', 'list-checks', 6);

-- Etapas
INSERT OR IGNORE INTO steps (id, title, description, sort_order) VALUES
  (1, 'Escolha seu pacote', 'Entre em contato pelo WhatsApp e tire suas dúvidas.', 1),
  (2, 'Envie as informações', 'Envie fotos, informações e preços dos seus produtos.', 2),
  (3, 'Produção', 'A equipe estrutura os materiais de acordo com o escopo contratado.', 3),
  (4, 'Validação', 'Você confere o material antes da conclusão.', 4);

-- FAQs
INSERT OR IGNORE INTO faqs (id, question, answer, sort_order) VALUES
  (1, 'O que exatamente está incluído nos pacotes?', 'Cada pacote lista de forma transparente tudo o que está incluído. O Essencial foca na estruturação do WhatsApp Business e catálogo; o Plus adiciona materiais digitais como cardápio interativo, cartão digital e artes promocionais. Antes de fechar, você recebe a descrição completa do escopo pelo WhatsApp.', 1),
  (2, 'Preciso entender de tecnologia para usar?', 'Não. Todo o processo é conduzido pela equipe e, ao final, você recebe orientações simples de uso. O objetivo é justamente facilitar o seu dia a dia, não complicar.', 2),
  (3, 'Quanto tempo leva para ficar pronto?', 'O prazo varia conforme o pacote e a quantidade de produtos. Após o envio das informações, alinhamos um prazo realista com você pelo WhatsApp antes de iniciar a produção.', 3),
  (4, 'O pagamento é mensal?', 'Não. Os pacotes têm taxa única, paga uma só vez pelo serviço de estruturação. Não há mensalidade embutida.', 4),
  (5, 'Vocês atendem apenas Pedreiras?', 'O foco principal é Pedreiras — MA e região, mas como o serviço é digital, negócios de outras cidades também podem ser atendidos. Consulte pelo WhatsApp.', 5),
  (6, 'Posso pedir ajustes no material?', 'Sim. Antes da conclusão existe uma etapa de validação em que você confere o material e pode solicitar ajustes dentro do escopo contratado.', 6),
  (7, 'O serviço é oferecido pela UEMA?', 'Não. Trata-se de um projeto de aplicação prática em Gestão Comercial desenvolvido no contexto acadêmico de Pedreiras, com identidade e responsabilidade próprias, independente da instituição de ensino.', 7);

-- Mídia inicial (imagens estáticas do projeto)
INSERT OR IGNORE INTO media (id, filename, mime_type, url, alt_text, title, source) VALUES
  (1, 'uema-logo-recortado.png', 'image/png', '/static/uema-logo-recortado.png', 'Logotipo da Universidade Estadual do Maranhão (UEMA)', 'Logo UEMA', 'Fornecida pelo administrador'),
  (2, 'projeto-logo-recortado.png', 'image/png', '/static/projeto-logo-recortado.png', 'Símbolo da Assessoria Comercial UEMA Pedreiras: globo com aperto de mãos', 'Logo do Projeto', 'Fornecida pelo administrador');

-- Seção de depoimentos (os depoimentos em si são cadastrados no painel)
INSERT OR REPLACE INTO content (key, value) VALUES
('testimonialsSection', json('{
  "enabled": true,
  "title": "O que dizem os empreendedores",
  "subtitle": "Relatos de quem organizou o atendimento e a presença digital do próprio negócio."
}'));

-- Seção de contato (formulário do site)
INSERT OR REPLACE INTO content (key, value) VALUES
('contactSection', json('{
  "enabled": true,
  "title": "Fale com a nossa equipe",
  "subtitle": "Conte o que o seu negócio precisa. Respondemos em até 1 dia útil e o atendimento é gratuito para empreendedores de Pedreiras e região."
}'));
