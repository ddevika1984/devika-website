/* ------------------------------------------------------------------
   Dr. Devika Kamat — site content
   Everything a non-developer is likely to change lives in CONFIG or CH
   below. See CLAUDE.md in the repo root before editing further down.

   Loaded before assets/detail.js, assets/chapter.js and assets/site.js,
   all of which read CONFIG and CH as plain globals. Split into its own
   file so offering.html can render a single chapter from the same data
   the homepage uses, without a second copy of it anywhere to drift out
   of sync with the real prices and payment links.
   ------------------------------------------------------------------ */

var CONFIG = {
  /* Events and guides are edited in Google Sheets. /api/events and
     /api/guides read those sheets on the server and hand back JSON.
     If a sheet is unreachable the page quietly falls back to the copy
     committed in content/, so a broken sheet shows slightly stale
     content rather than an error. */
  eventsUrl: '/api/events',
  eventsFallback: 'content/events.json',
  guidesUrl: '/api/guides',
  guidesFallback: 'content/guides.json',
  reviewsUrl: '/api/reviews',
  reviewsFallback: 'content/reviews.json',
  email: 'info@drddevikakamat.com'
};

var CH = [
 {id:"discovery-call",key:"root",sans:"Muladhara",en:"Root",c:"#8F5A42",bg:"#211A17",fg:"#F0ECDC",
  t:"Discovery call",
  img:"images/discoverycall.webp",
  for_:"For finding out whether I can actually help you.",
  det:"We start with a casual conversation about your goals and concerns, and I explain honestly how I think I can help. Some people call it a clarity call. If I am not the right person you will leave knowing who is.",
  f:[["Length","30 minutes"],["Where","Online"],["Cost","₹2,500"]],
  cta:{label:"Book this",href:"https://rzp.io/rzp/2CNVQp0i"}},

 {id:"wellness-circle",key:"sacral",sans:"Svadhisthana",en:"Sacral",c:"#7A4340",bg:"#1E1614",fg:"#F0ECDC",
  t:"35+ Women's Wellness Circle",
  img:"images/womenswellnesscircle.webp",
  for_:"For not doing this on your own.",
  det:"The Women's Wellness Circle is a WhatsApp community for women dealing with the same things at the same time. Sleep, hormones, energy, and the things that are hard to say out loud anywhere else. It is a space to connect with other women who get it, understand your body alongside me, take on challenges together, and work on your mind, body, and soul.",
  f:[["Format","Group"],["Cost","Free"]],
  cta:{label:"Join this",href:"https://chat.whatsapp.com/DIMbyxT7PbLBq0O6Puo1BI?mode=gi_t"}},

 {id:"guides",key:"solar",sans:"Manipura",en:"Solar plexus",c:"#AC6670",bg:"#2C1C1C",fg:"#F0ECDC",
  t:"Guides You Can Download and Use",
  img:"images/selfhelp.webp",
  for_:"For the days you would rather do this on your own.",
  det:"Guided audio, written practices and plain guides you buy once and keep. Use them between sessions, or instead of them. Nothing here needs me in the room.",
  f:[],
  guides:true},

 {id:"nutrition",key:"heart",sans:"Anahata",en:"Heart",c:"#CC8A77",bg:"#3E2723",fg:"#F0ECDC",
  t:"Integrative nutrition",
  img:"images/integrativenutrition.webp",
  for_:"For energy, digestion and weight that will not shift.",
  det:"Eating built around the routine you already have, the budget you already have and the kitchen you already have. Each month is three nutrition sessions and one session on wellness, stress management and mindset, reviewed weekly and adjusted as we go.",
  note:"After the discovery call or first session, the plan may be customised to your requirements and goals, including the number of nutrition and wellness sessions, so the price may differ depending on how it is personalised.",
  f:[["Length","1 month or 3 months"],["Format","One to one"],["Cost","From ₹12,700"]],
  /* ₹12,700 and ₹35,000 are also written into integrative-nutrition.html
     (and are the nutrition-4 / nutrition-12 amounts in api/lib/products.js):
     change all three together. */
  picker:{
    groups:[{key:"length",opts:[["month","1 month"],["three","3 months"]]}],
    prices:{
      month:{price:"₹12,700", sub:"4 weekly sessions: 3 nutrition plans and 1 wellness and mindset session.", href:"https://rzp.io/rzp/hJMniutv"},
      three:{price:"₹35,000", sub:"12 weekly sessions: 9 nutrition plans and 3 wellness and mindset sessions.", href:"https://rzp.io/rzp/IN90days"}
    }
  },
  page:"/integrative-nutrition"},

 {id:"counseling",key:"throat",sans:"Vishuddha",en:"Throat",c:"#9C9078",bg:"#453F35",fg:"#F0ECDC",
  t:"Holistic counseling, rewiring and energy alignment",
  img:"images/holisticcounseling-v2.webp",
  for_:"For when you are carrying something you cannot put down.",
  det:"Talking and gentle energy work in the same session. Mostly quiet, and focused on whatever is sitting heavy for you right now.",
  f:[["Length","60 to 90 minutes"],["Where","Online or in person"],["Cost","From ₹8,000"]],
  picker:{
    groups:[{key:"places",opts:[["online","Online"],["person","In person"]]}],
    prices:{
      online:{price:"₹8,000",  href:"https://rzp.io/rzp/JXSLclA"},
      person:{price:"₹10,000", href:"https://rzp.io/rzp/3BS7M02S"}
    }
  }},

 {id:"meditation-club",key:"crown",sans:"Sahasrara",en:"Crown",c:"#8A7A5E",bg:"#EDE8D8",fg:"#2B2118",
  t:"The Meditation Club",
  img:"images/meditationclub.webp",
  for_:"For building a practice you will actually keep.",
  det:"Twenty minutes, live, with a group that sits together three evenings a week. No experience needed and no pressure to say anything. Come when you can, miss it when you cannot.",
  f:[["Meets","Mon, Tue, Thu at 9.15pm"],["Format","Group"]],
  note:"Pick Monthly to try it and pay once, or Auto-renew to subscribe and keep your place each month.",
  /* Its own page, meditation-club.html, also at the short link
     /meditation-club. Its ₹1,198 and both links below are written into
     that page by hand too: change both files together. */
  page:"/meditation-club",
  /* Both hrefs are live Razorpay links - do not touch without being asked
     (golden rule 1). Their Redirect URLs should be
     https://<site>/api/book?p=meditation-monthly and ?p=meditation-annual,
     which send the customer to join the WhatsApp group after paying.

     Auto-renew (key `annual`) is RNKAxkAi since 30 Sep 2026, replacing
     ZKpaUoT, which had started showing an error on Razorpay.

     `sub` is the one-line explainer chapter.js renders under the price,
     so it is unmissable which option auto-charges and which does not -
     both cost the same ₹1,198, so the price alone does not say. */
  picker:{
    groups:[{key:"plan",opts:[["monthly","Monthly"],["annual","Auto-renew"]]}],
    prices:{
      monthly:{
        price:"₹1,198",
        sub:"One-time payment. Covers one month, then pay again whenever you want to continue.",
        href:"https://rzp.io/rzp/TxHHo7r"
      },
      annual:{
        price:"₹1,198/month",
        sub:"Subscription. ₹1,198 is charged on the day you join, then on the same date every month until you cancel.",
        href:"https://rzp.io/rzp/RNKAxkAi"
      }
    }
  }}
];
