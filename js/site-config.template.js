const isLocalPreview =
    typeof window !== 'undefined' &&
    /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

const SITE = {
    // Update canonicalUrl, contactEmail, privacyEmail, and og:url tags across HTML when domain goes live.
    brandName: 'Bespoke AI',
    legalName: 'Bespoke Core AI Engineering Limited',
    contactEmail: 'info@bespoke-ai.ie',
    privacyEmail: 'info@bespoke-ai.ie',
    linkedIn: 'https://www.linkedin.com/in/karl-nolan-bespoke-ai/',
    canonicalUrl: '${CANONICAL_URL}',
    googleFormUrl: 'https://forms.gle/HCQSAhwR9JJpygxb9',
    showWorkshop: false,
    workshopHubUrl: 'agentic-impact-workshop.html',
    workshopApplicationFormUrls: {
        foundations: 'https://docs.google.com/forms/d/e/1FAIpQLSfxOWUF7taVGa3elYl28JZpebJwUcFnpKG42qyZaRLhYbymIg/viewform',
        engineering: 'https://docs.google.com/forms/d/e/1FAIpQLSfqQlawqCZfgIwJ653dPEME039aB303ZOzGn--tyxBqCZKJkQ/viewform',
        automation: 'https://docs.google.com/forms/d/e/1FAIpQLSfiq9GHiqYih0mAi3BoxI8cZA9P643JNAviMdsPb2cN5BiPEA/viewform',
    },
    workshopOnePagerPdf: 'workshop-one-pager.pdf',
    partialVersion: '20260820c',
    assessmentUrl: '${ASSESSMENT_URL}',
    workflowAssessmentUrl: 'workflow-assessment.html',
    whatWeAutomateUrl: 'what-we-automate.html',
    scopingUrl: 'scoping.html',
    aboutUrl: 'about.html',
    aiEngineeringUrl: 'ai-engineering.html',
    caseStudiesUrl: 'case-studies.html',
    poSalesOrderUrl: 'po-sales-order.html',
    smartInboxUrl: 'smart-inbox.html',
    trainingUrl: 'training.html',
    fundamentalsFormUrls: {
        individual: '',
        group: '',
    },
    navOrder: ['offer', 'engagement', 'where-to-start', 'ai-engineering', 'about'],
    // GenAI iframe embed — when set, replaces the n8n Ask BCAI widget.
    chatEmbedUrl: '${CHAT_EMBED_URL}',
    chatWebhookUrl: isLocalPreview
        ? 'http://localhost:5678/webhook/bcai-website-chat/chat'
        : '${CHAT_WEBHOOK_URL}',
    chatWarmCacheUrl: isLocalPreview
        ? 'http://localhost:5678/webhook/bcai-warm-knowledge'
        : '${CHAT_WARM_CACHE_URL}',
    chatGreeting: 'Hi — I\'m Ask BCAI (Bespoke Core AI Engineering). I can answer questions about Bespoke AI and this website. What would you like to know?',
    bookingScheduleUrl: '${BOOKING_URL}',
    bookingEmbedUrl: '${BOOKING_URL}?gv=true',
    bookingUrl: isLocalPreview
        ? '/#discovery-call'
        : '${CANONICAL_URL}#discovery-call',
    googleDriveKnowledgeFolderId: '1TtHiEjxrG20SCaAK4G-EuzRJY7TcKQA2',
    gaMeasurementId: 'G-YBVQT5NFWE',
};
