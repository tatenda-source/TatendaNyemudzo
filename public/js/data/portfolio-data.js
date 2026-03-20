/**
 * Portfolio Data - Extracted from Tatenda Nyemudzo's CV
 * This data will be used to populate the portfolio apps in Phase 3
 */

const PortfolioData = {
    // Personal Information
    name: "Tatenda Nyemudzo",
    title: "Full Stack Developer",
    location: "Leeuwarden, The Netherlands",
    phone: "+31 6 4717 9310",
    email: "tatendawalter62@gmail.com",
    github: "github.com/muudzo",

    // Professional Summary
    summary: `I'm a Full Stack Developer combining design with a "product-first" mindset. I have a proven ability to architect and deploy end to end solutions (Laravel, Node.js, PWA), moving rapidly from idea to prototype and then production. Distinguished by a track record of identifying market gaps specifically in Fintech, Agritech, and public welfare and engineering technical solutions that secured buy-in and executive sponsorship. Recipient of the NHL Stenden Excellency Scholarship.`,

    // Technical Arsenal
    skills: {
        languages: [
            "PHP 8+",
            "JavaScript (ES6+)",
            "TypeScript",
            "Python",
            "SQL"
        ],
        frameworks: [
            "Laravel (MVC)",
            "React.js",
            "Express",
            "FastAPI"
        ],
        webTechnologies: [
            "Progressive Web Apps (PWA)",
            "REST APIs",
            "Service Workers"
        ],
        devOpsTools: [
            "Git",
            "GitHub",
            "MySQL",
            "MongoDB",
            "Figma (UI/UX)"
        ]
    },

    // Projects Portfolio
    projects: [
        {
            id: "zse-platform",
            title: "ZSE Investment Learning Platform",
            role: "Full Stack Developer",
            description: "Designed and shipped a simulation platform to democratize access to the Zimbabwe Stock Exchange (ZSE).",
            technologies: ["Laravel", "MySQL", "JavaScript", "PWA"],
            highlights: [
                "Built a robust MVC application using Laravel for user authentication, portfolio management, and secure data transactions.",
                "Leveraged Eloquent ORM to manage relationships between user profiles, virtual wallets, and real-time stock data.",
                "Developed a responsive interface optimized for low-bandwidth environments."
            ],
            category: "Fintech",
            github: "https://github.com/muudzo/investment-gamified"
        },
        {
            id: "zippie-payments",
            title: "Zippie - P2P Payment App for Zimbabwe",
            role: "Full Stack Developer",
            description: "Comprehensive fintech platform combining peer-to-peer payments with AI-powered stock market predictions for the Zimbabwean market.",
            technologies: ["TypeScript", "React", "Node.js", "JWT", "Machine Learning"],
            highlights: [
                "Built P2P payment system with multi-currency accounts (USD, ZWL), transaction history, and QR code payments.",
                "Integrated AI-powered stock market predictions with technical indicators (RSI, MACD, Moving Averages).",
                "Real-time stock quotes via Alpha Vantage and Yahoo Finance APIs with interactive charts."
            ],
            category: "Fintech",
            github: "https://github.com/muudzo/Zippie-Payment-App-for-Zimbabwe"
        },
        {
            id: "zimlivestock",
            title: "ZimLivestock - Livestock Marketplace",
            role: "Backend Developer",
            description: "RESTful backend for online livestock auctions, enabling Zimbabwean farmers and buyers to list animals and bid in real-time.",
            technologies: ["FastAPI", "Python", "TypeScript", "REST API"],
            highlights: [
                "Real-time bidding system with minimum increment enforcement and auction time tracking.",
                "User registration with Zimbabwean phone number validation (+263/07x formats).",
                "Livestock categorization, filtering, and auction lifecycle management."
            ],
            category: "Agritech",
            github: "https://github.com/muudzo/zimlivestock1"
        },
        {
            id: "closet-muse",
            title: "Closet Muse - AI Fashion Assistant",
            role: "Full Stack Developer",
            description: "AI-powered mobile app interface for smart wardrobe management and personalized outfit recommendations.",
            technologies: ["TypeScript", "React", "Vite", "AI/ML"],
            highlights: [
                "Digital closet with smart filters by category, color, season, and occasion.",
                "AI-powered outfit recommendations based on wardrobe contents and preferences.",
                "Wear tracking analytics to monitor clothing usage patterns."
            ],
            category: "AI / Lifestyle",
            github: "https://github.com/muudzo/Closet-Muse-Mobile-App-Interface"
        },
        {
            id: "nowhere",
            title: "Nowhere - Ephemeral Social Utility",
            role: "Full Stack Developer",
            description: "Real-time, location-scoped platform for finding and joining spontaneous gatherings without social pressure.",
            technologies: ["FastAPI", "Python", "React Native", "Expo", "Redis"],
            highlights: [
                "Time-bound intents that expire in 24 hours — no permanent social footprint.",
                "Redis-powered geo-indexing for real-time location-scoped discovery.",
                "Anonymous, device-scoped identity with no email or social graph required."
            ],
            category: "Social / Utility",
            github: "https://github.com/muudzo/nowhere"
        },
        {
            id: "zimlingua",
            title: "ZimLingua - Neural Machine Translation",
            role: "ML Engineer",
            description: "Offline neural machine translation tool for low-resource languages (Shona/Ndebele/English) using Meta's NLLB-200 model.",
            technologies: ["Python", "NLLB-200", "CTranslate2", "LoRA"],
            highlights: [
                "Offline CPU inference using Int8 quantization via CTranslate2.",
                "Custom LoRA fine-tuning pipeline for Shona and Ndebele languages.",
                "Data processing tools for normalizing and cleaning low-resource language datasets."
            ],
            category: "AI / NLP",
            github: "https://github.com/muudzo/zimlingua"
        },
        {
            id: "clearledger",
            title: "ClearLedger - Merchant Transaction Tracker",
            role: "Full Stack Developer",
            description: "Manual-first transaction logging tool for Zimbabwean merchants to track daily payments across channels (EcoCash, ZIPIT, Bank, Cash).",
            technologies: ["FastAPI", "Python", "SQLModel", "SQLite", "JWT"],
            highlights: [
                "Daily truth dashboard showing totals by status (Expected, Received, Pending, Missing).",
                "24-hour flagging system for overdue expected transactions.",
                "Optimized for sub-30-second transaction logging workflow."
            ],
            category: "Fintech",
            github: "https://github.com/muudzo/cleartruthledger_mvp"
        },
        {
            id: "hrdesk",
            title: "HrDesk - AI-Powered HR Help Desk",
            role: "Backend Developer",
            description: "Production-ready ASP.NET Core 8 backend for an AI-powered HR Help Desk with PeopleHum integration.",
            technologies: ["C#", "ASP.NET Core 8", "Serilog", "Hangfire", "JWT"],
            highlights: [
                "Clean architecture with API Gateway / BFF pattern and modular design.",
                "Intent-based chat routing with AI orchestrator interface.",
                "Audit logging, correlation IDs, background jobs, and Swagger documentation."
            ],
            category: "Enterprise / AI",
            github: "https://github.com/muudzo/HR-HELP"
        },
        {
            id: "farmtracker",
            title: "FarmTracker - Agricultural Management",
            role: "Full Stack Developer",
            description: "Farm management platform built with Laravel to help farmers track operations and optimize productivity.",
            technologies: ["Laravel", "PHP", "Blade", "MySQL"],
            highlights: [
                "Full MVC application with Laravel for farm data management.",
                "Blade templating for responsive farm tracking dashboards.",
                "Built for the Zimbabwean agricultural sector."
            ],
            category: "Agritech",
            github: "https://github.com/muudzo/farmtracker.com"
        },
        {
            id: "zse-scraper",
            title: "ZSE Data Scraper",
            role: "Developer",
            description: "Python-based data scraper for extracting real-time stock data from the Zimbabwe Stock Exchange.",
            technologies: ["Python", "Web Scraping"],
            highlights: [
                "Automated extraction of ZSE stock market data.",
                "Data pipeline feeding into the ZSE Investment Learning Platform."
            ],
            category: "Fintech / Data",
            github: "https://github.com/muudzo/zse-data-scrapper"
        },
        {
            id: "school-payments",
            title: "School Payments Management System",
            role: "Frontend Developer",
            description: "UI system for managing school fee payments, designed in Figma and built with TypeScript.",
            technologies: ["TypeScript", "React", "Figma"],
            highlights: [
                "Designed and prototyped in Figma, then built as a functional web application.",
                "Payment tracking and management interface for educational institutions."
            ],
            category: "EdTech",
            github: "https://github.com/muudzo/School-Payments-Management-System"
        },
        {
            id: "gig-driver",
            title: "Gig Economy Driver App",
            role: "Frontend Developer",
            description: "Mobile-first UI for gig economy drivers to manage deliveries and track earnings.",
            technologies: ["TypeScript", "React"],
            highlights: [
                "Clean, mobile-optimized interface for on-the-go driver workflows.",
                "Delivery management and earnings tracking dashboard."
            ],
            category: "Gig Economy",
            github: "https://github.com/muudzo/Gig-Economy-Driver-App-UI"
        },
    ],

    // About Me (from professional summary)
    about: {
        intro: "Full Stack Developer with a product-first mindset",
        focus: "Fintech, Agritech, and public welfare solutions",
        approach: "Rapid prototyping from idea to production",
        recognition: "NHL Stenden Excellency Scholarship Recipient"
    }
};

// Export for use in apps
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioData;
}

// Make available globally for browser
if (typeof window !== 'undefined') {
    window.PortfolioData = PortfolioData;
}
