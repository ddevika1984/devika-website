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
 {id:"c0",key:"root",sans:"Muladhara",en:"Root",c:"#8F5A42",bg:"#211A17",fg:"#F0ECDC",
  t:"Discovery call",
  img:"images/discoverycall.webp",
  for_:"For finding out whether I can actually help you.",
  det:"We start with a casual conversation about your goals and concerns, and I explain honestly how I think I can help. Some people call it a clarity call. If I am not the right person you will leave knowing who is.",
  f:[["Length","30 minutes"],["Where","Online"],["Cost","₹2,500"]],
  cta:{label:"Book this",href:"https://rzp.io/rzp/2CNVQp0i"}},

 {id:"c1",key:"sacral",sans:"Svadhisthana",en:"Sacral",c:"#7A4340",bg:"#1E1614",fg:"#F0ECDC",
  t:"35+ Women's Wellness Circle",
  img:"images/womenswellnesscircle.webp",
  for_:"For not doing this on your own.",
  det:"The Women's Wellness Circle is a WhatsApp community for women dealing with the same things at the same time. Sleep, hormones, energy, and the things that are hard to say out loud anywhere else. It is a space to connect with other women who get it, understand your body alongside me, take on challenges together, and work on your mind, body, and soul.",
  f:[["Format","Group"],["Cost","Free"]],
  cta:{label:"Join this",href:"https://chat.whatsapp.com/DIMbyxT7PbLBq0O6Puo1BI?mode=gi_t"}},

 {id:"c2",key:"solar",sans:"Manipura",en:"Solar plexus",c:"#AC6670",bg:"#2C1C1C",fg:"#F0ECDC",
  t:"Guides You Can Download and Use",
  img:"images/selfhelp.webp",
  for_:"For the days you would rather do this on your own.",
  det:"Guided audio, written practices and plain guides you buy once and keep. Use them between sessions, or instead of them. Nothing here needs me in the room.",
  f:[],
  guides:true},

 {id:"c3",key:"heart",sans:"Anahata",en:"Heart",c:"#CC8A77",bg:"#3E2723",fg:"#F0ECDC",
  t:"Integrative nutrition",
  img:"images/integrativenutrition.webp",
  for_:"For energy, digestion and weight that will not shift.",
  det:"A month of eating built around the routine you already have, the budget you already have and the kitchen you already have. Three nutrition sessions and one energy session across the month, reviewed weekly and adjusted as we go.",
  f:[["Length","4 sessions over 1 month"],["Format","One to one"],["Cost","₹15,000"]],
  cta:{label:"Book this",href:"https://rzp.io/rzp/hJMniutv"}},

 {id:"c4",key:"throat",sans:"Vishuddha",en:"Throat",c:"#9C9078",bg:"#453F35",fg:"#F0ECDC",
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

 {id:"c6",key:"crown",sans:"Sahasrara",en:"Crown",c:"#8A7A5E",bg:"#EDE8D8",fg:"#2B2118",
  t:"The Meditation Club",
  img:"images/meditationclub.webp",
  for_:"For building a practice you will actually keep.",
  det:"Twenty to thirty minutes, a group that sits together regularly. No experience needed and no pressure to say anything. Come when you can, miss it when you cannot.",
  f:[["Meets","Mon, Tue, Thu at 9.15pm"],["Format","Group"],["Cost","₹1,198 a month"]],
  note:"A monthly subscription. Cancel whenever you want.",
  cta:{label:"Join this",href:"https://rzp.io/rzp/POuxLAl"}}
];
