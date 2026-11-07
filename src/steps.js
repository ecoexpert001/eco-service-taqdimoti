// The storyboard: one application, eight stages. Every fact is from the ECO SERVICE process deck.
//
// layout: 'hero' | 'center' | 'top' | 'side' (default)
// card:   { title, body, block, note } or { hero, sub, sig }
// visual: { type, phase }  (see visuals.js)
// map:    camera + layer state (see map.js). 'route:<p>' cameras follow the application along
//         its route; `route` draws how far it has come; `dim` darkens the ground behind visuals.
// rail:   { show, at, done } for the docked 8-station rail
//
// All text goes through t(): English here, Uzbek and Russian in locales.js.
import { t } from './i18n.js';

const leaf = { pulse: true, tone: 'leaf' };
const ILLUSTRATION = t('Illustration of the ECO SERVICE workflow; sample data from the process deck.');
const at = (stage) => ({ show: true, at: stage, done: stage - 1 });

// Behind a step's visual: a cold, dark ground; the border subdued so labels never cross a glow;
// the application stays lit on its route in the band under the top bar.
const night = (cam, route, extra = {}) => ({
  cam, sat: 0.9, mask: 0.55, uzb: 0.22, regions: 0, nb: 0.15, world: 0.1, dim: 0.75, drift: 0.15,
  route, site: leaf, ...extra,
});
const out = (to) => ({ dir: 'out', to, head: true });
const home = { dir: 'back', to: 1, head: true }; // the signed conclusion, back at the applicant

export const STEPS = [
  // 1 — Opening
  {
    layout: 'hero',
    cue: true,
    card: {
      hero: true,
      sub: t('Digital Platform for State Ecological Expertise'),
      sig: [t('State Ecological Expertise Center'), 'eco-service.uz', t('Tashkent 2026')],
    },
    map: { cam: 'globe', sat: 0.9, mask: 0.6, uzb: 1, world: 0.25, nb: 0, drift: 0.6, site: {} }, // the application does not exist yet
  },
  // 2
  {
    layout: 'center',
    card: {
      title: t('One application. Eight stages. Every step in digital form.'),
      body: t('ECO SERVICE carries an application for state ecological expertise from submission to a signed conclusion entirely in digital form: no paper, no queues, no visits.'),
    },
    map: { cam: 'country', camDur: 4600, sat: 0.85, mask: 0.62, uzb: 0.28, regions: 0, nb: 0.3, world: 0.15, dim: 0.45, drift: 0.25, site: {} },
  },
  // 3
  {
    layout: 'top',
    card: { title: t('Eight stages, one digital system'), body: t('Every stage, from intake to signing, runs digitally inside ECO SERVICE.') },
    visual: { type: 'rail', phase: 0 },
    map: { cam: 'country', sat: 0.75, mask: 0.65, uzb: 0.28, regions: 0, nb: 0.2, world: 0.1, dim: 0.62, drift: 0.25, site: {} },
  },
  // 4
  {
    card: {
      title: t('Let’s follow one electronic application'),
      body: t('A school building is planned in the Fergana Valley. Its electronic application enters the system as No. 371668581.'),
      block: { type: 'ticket' },
      note: t('Sample application and site coordinates from the ECO SERVICE process deck.'),
    },
    map: { cam: 'valley', camDur: 5400, sat: 1, mask: 0.7, uzb: 0.9, regions: 0.15, nb: 0.3, drift: 0.2, site: { pulse: true, tag: true } },
    rail: at(1),
  },

  // Stage 1 — Intake
  // The electronic application on my.gov.uz, one tab per step, as on the portal.
  {
    card: {
      title: t('Step 1: the object, in a digital form'),
      body: t('On my.gov.uz the applicant fills in the electronic application step by step. The applicant’s own data come from the personal account automatically.'),
      note: t('Illustration; applicant data are hidden, sample values.'),
    },
    visual: { type: 'apply', phase: 0 },
    map: night('route:0', null, { site: { pulse: true } }),
    rail: at(1),
  },
  {
    card: {
      title: t('Step 2: technical and economic indicators'),
      body: t('Areas and buildings are entered as numbers. The form calculates the share of green space by itself and checks it against the norm.'),
      note: t('Illustration; sample values.'),
    },
    visual: { type: 'apply', phase: 1 },
    map: night('route:0', null, { site: { pulse: true } }),
    rail: at(1),
  },
  {
    card: {
      title: t('Step 3: impact on the environment'),
      body: t('Emissions into the air, water use, wastewater and waste are entered in digital tables. Totals are added up automatically.'),
      note: t('Illustration; sample values.'),
    },
    visual: { type: 'apply', phase: 2 },
    map: night('route:0', null, { site: { pulse: true } }),
    rail: at(1),
  },
  {
    card: {
      title: t('Step 4: the object drawn on the map'),
      body: t('If they wish, the applicant draws the object’s outline on the satellite map or enters its coordinates. Documents are attached as files, and one click sends the application.'),
      note: t('Imagery: Esri World Imagery. Corner coordinates from the ECO SERVICE process deck.'),
    },
    visual: { type: 'apply', phase: 3 },
    map: night('route:0', null, { site: { pulse: true } }),
    rail: at(1),
  },
  {
    card: {
      title: t('It starts on my.gov.uz'),
      body: t('The electronic application is submitted on the Single Portal of Interactive Public Services. Through system integration it goes straight into ECO SERVICE.'),
    },
    visual: { type: 'flow', phase: 0 },
    map: night('route:0', null, { site: { pulse: true, tag: true } }),
    rail: at(1),
  },
  {
    card: {
      title: t('Two units see it at the same moment'),
      body: t('ECO SERVICE routes the application digitally, at the same moment, to the district ecological inspector and the Application Intake Department.'),
    },
    visual: { type: 'flow', phase: 1 },
    map: night('route:0', null, { site: { pulse: true, tag: true } }),
    rail: at(1),
  },
  {
    card: {
      title: t('Every e-application carries the same key data'),
      body: t('Number and date, applicant, TIN or PINFL, object of expertise, impact category and type of materials.'),
      note: t('Fields without sample values in the process deck are shown as placeholders.'),
    },
    visual: { type: 'record', phase: 0 },
    map: night('route:0', null, { site: { pulse: true, tag: true } }),
    rail: at(1),
  },
  {
    card: {
      title: t('The inspector goes to the site'),
      body: t('The application appears in the inspector’s electronic account with its number, applicant, object and deadline.'),
      block: { type: 'account' },
    },
    map: { cam: 'village', camDur: 5200, sat: 1, mask: 0, uzb: 0, drift: 0.35, site: { pulse: true, tag: true } },
    rail: at(1),
  },
  {
    card: {
      title: t('The coordinates must match'),
      body: t('On site, the inspector measures the corners with GPS. The system compares them with the coordinates in the application.'),
      block: { type: 'coords' },
    },
    map: { cam: 'site', camDur: 3600, sat: 1, mask: 0, uzb: 0, drift: 0.5, site: { poly: true, corners: true } },
    rail: at(1),
  },
  {
    card: {
      title: t('Checked against nine criteria on the digital map'),
      body: t('The inspector examines the surroundings of the object on the satellite map and on the ground.'),
      block: { type: 'criteria' },
      note: t('Imagery: Esri World Imagery. Markers show matching features visible around the site and are illustrative; the inspector records the actual findings.'),
    },
    map: { cam: 'siteWide', camDur: 3200, sat: 1, mask: 0, uzb: 0, drift: 0.6, site: { poly: true, ring: true, criteria: true } },
    rail: at(1),
  },
  {
    card: {
      title: t('Checked against restricted zones'),
      body: t('The system automatically checks the site’s coordinates against four digital map layers: water protection zones, forestry lands, reservoirs and drinking groundwater deposits.'),
      block: { type: 'zones' },
      note: t('Layers: KMZ files of restricted zones (SMQZ as of 16.09.2024). The check and the distances are computed from the site coordinates.'),
    },
    map: { cam: 'zones', camDur: 4200, sat: 1, mask: 0, uzb: 0, drift: 0.2, zones: 'link', site: { pulse: true, poly: true } },
    rail: at(1),
  },
  {
    card: {
      title: t('The digital site inspection act'),
      body: t('The inspector fills in the act in the system: the object on the map, its measured coordinates and each of the nine criteria, with a comment.'),
      note: t('Illustration; the findings are sample values, the zone line is computed from the KMZ layers.'),
    },
    visual: { type: 'inspect', phase: 0 },
    map: { cam: 'siteWide', camDur: 3000, sat: 1, mask: 0, uzb: 0, dim: 0.72, drift: 0.4, site: { poly: true } },
    rail: at(1),
  },
  {
    card: {
      title: t('Accept or reject. Then the record locks.'),
      body: t('The inspector accepts or rejects the application in the system. After that, the electronic findings can no longer be edited.'),
      block: { type: 'decide' },
    },
    map: { cam: 'site', camDur: 3000, sat: 1, mask: 0, uzb: 0, drift: 0.5, site: { poly: true, tone: 'leaf' } },
    rail: at(1),
  },
  {
    card: {
      title: t('The Intake Department reviews the electronic file'),
      body: t('It checks the electronic form, the project documents and the inspector’s digital site act, all in one window.'),
      note: ILLUSTRATION,
    },
    visual: { type: 'intake', phase: 0 },
    map: { ...night('route:0', null, { site: { pulse: true, tag: true, tone: 'leaf' } }), camDur: 5000 },
    rail: at(1),
  },
  {
    card: {
      title: t('Approve, return or reject, and rate the designer'),
      body: t('The department decides on the application in the system and rates the project developer on a scale of 1 to 100.'),
      note: ILLUSTRATION,
    },
    visual: { type: 'intake', phase: 1 },
    map: night('route:0', null, { site: { pulse: true, tag: true, tone: 'leaf' } }),
    rail: at(1),
  },

  // Stage 2 — Payment
  {
    card: {
      title: t('Payment happens online'),
      body: t('Once the application is accepted, an electronic invoice is issued and appears in the applicant’s personal account.'),
    },
    visual: { type: 'payment', phase: 0 },
    map: night('route:0.17', out(0.17)),
    rail: at(2),
  },
  {
    card: {
      title: t('The applicant pays in a few clicks'),
      body: t('In the personal account, the applicant enters the invoice number and presses Pay. The payment goes straight to the Center’s account.'),
      note: t('Illustration; the invoice number is a sample.'),
    },
    visual: { type: 'payment', phase: 1 },
    map: night('route:0.17', out(0.17)),
    rail: at(2),
  },
  {
    card: {
      title: t('Paid: the system confirms it by itself'),
      body: t('When the invoice is paid, the system records the payment and sets the status to “Paid” automatically.'),
    },
    visual: { type: 'payment', phase: 2 },
    map: night('route:0.17', out(0.17)),
    rail: at(2),
  },

  // Stage 3 — Assignment
  {
    card: {
      title: t('Assigned to the responsible expert'),
      body: t('Once payment is made, the system assigns the application to the expert responsible for its review.'),
      note: ILLUSTRATION,
    },
    visual: { type: 'assign', phase: 0 },
    map: night('route:0.34', out(0.34), { site: {} }),
    rail: at(3),
  },
  {
    card: {
      title: t('Deadlines and history are kept digitally'),
      body: t('Deadlines are calculated automatically, the application appears in the expert’s account, and every action is recorded in the history.'),
      note: ILLUSTRATION,
    },
    visual: { type: 'assign', phase: 1 },
    map: night('route:0.34', out(0.34), { site: {} }),
    rail: at(3),
  },

  // Stage 4 — Conclusion: the expert sees the site too, then drafts the conclusion
  {
    card: {
      title: t('The expert also goes to the site'),
      body: t('Like the inspector, the responsible expert visits the object to see the conditions on the ground.'),
      block: { type: 'account', who: 'expert' },
    },
    map: { cam: 'village', camDur: 5200, sat: 1, mask: 0, uzb: 0, drift: 0.35, site: { pulse: true, tag: true } },
    rail: at(4),
  },
  {
    card: {
      title: t('The expert checks the site on the ground'),
      body: t('The expert compares the inspector’s digital site act with the site itself and records the findings in the system.'),
      block: { type: 'verify' },
      note: t('Imagery: Esri World Imagery. Markers are illustrative.'),
    },
    map: { cam: 'siteWide', camDur: 3200, sat: 1, mask: 0, uzb: 0, drift: 0.6, zones: true, site: { poly: true, ring: true, criteria: true, tone: 'leaf' } },
    rail: at(4),
  },
  // The public hearing: like the site visit, the residents around the object are heard.
  {
    card: {
      title: t('The residents are heard: a public hearing'),
      body: t('Like the site visit, a public hearing is held: the people living near the object are heard about its construction. The hearing is announced online in advance.'),
      note: t('Illustration; participants and figures are sample values.'),
    },
    visual: { type: 'hearing', phase: 0 },
    map: { cam: 'village', camDur: 4200, sat: 1, mask: 0, uzb: 0, dim: 0.72, drift: 0.3, site: { pulse: true } },
    rail: at(4),
  },
  {
    card: {
      title: t('The hearing protocol joins the electronic file'),
      body: t('The signed protocol, photos and video are uploaded to the application’s electronic file. The expert sees them next to every other material.'),
      note: t('Illustration; participants and figures are sample values.'),
    },
    visual: { type: 'hearing', phase: 1 },
    map: { cam: 'village', sat: 1, mask: 0, uzb: 0, dim: 0.72, drift: 0.3, site: { pulse: true } },
    rail: at(4),
  },
  {
    card: {
      title: t('All materials in one electronic file'),
      body: t('The e-application, the inspector’s digital site act, the expert’s own site visit, the public hearing protocol and the coordinates.'),
      note: ILLUSTRATION,
    },
    visual: { type: 'conclusion', phase: 0 },
    map: night('route:0.5', out(0.5), { site: {} }),
    rail: at(4),
  },
  {
    card: {
      title: t('The conclusion is drafted on the official blank'),
      body: t('The expert fills in the electronic blank of the conclusion. The passport of ecological indicators comes from the e-application by itself.'),
      note: ILLUSTRATION,
    },
    visual: { type: 'conclusion', phase: 1 },
    map: night('route:0.5', out(0.5), { site: {} }),
    rail: at(4),
  },

  // Stage 5 — Review
  {
    card: {
      title: t('Supervisors check the draft'),
      body: t('They review the draft online. If they find issues, it goes back to the expert, who resolves them and resubmits.'),
    },
    visual: { type: 'review', phase: 0 },
    map: night('route:0.67', out(0.67), { site: {} }),
    rail: at(5),
  },
  {
    card: {
      title: t('Approved, and on to coordination'),
      body: t('Once the supervisors approve, the conclusion moves to Stage 6.'),
    },
    visual: { type: 'review', phase: 1 },
    map: night('route:0.67', out(0.67), { site: {} }),
    rail: at(5),
  },

  // Stage 6 — Coordination
  {
    card: {
      title: t('Coordinated with the National Committee'),
      body: t('The approved conclusion goes electronically to two divisions of the National Committee of the Republic of Uzbekistan for Ecology and Climate Change.'),
      block: { type: 'divisions' },
    },
    map: {
      cam: 'corridor', camDur: 5000, sat: 1, mask: 0.7, uzb: 0.85, regions: 0.15, nb: 0.25, drift: 0.2,
      route: { dir: 'out', to: 1, head: 'travel', dur: 3.2 }, tashkent: true, site: leaf,
    },
    rail: at(6),
  },
  {
    card: {
      title: t('Both divisions give their opinion'),
      body: t('The Department of Environmental Policy and the State Environmental Control Inspectorate each review the conclusion in the system.'),
    },
    visual: { type: 'coord', phase: 0 },
    map: { ...night('route:1', out(1), { site: {} }), camDur: 4200 },
    rail: at(6),
  },
  {
    card: {
      title: t('Agreed, and forwarded to the director'),
      body: t('With both opinions in, the agreed conclusion goes to the Center’s director.'),
    },
    visual: { type: 'coord', phase: 1 },
    map: night('route:1', out(1), { site: {} }),
    rail: at(6),
  },

  // Stage 7 — Approval
  {
    card: {
      title: t('Every approval in one digital view'),
      body: t('After all coordination steps, the conclusion reaches the Center’s director for final review.'),
      note: ILLUSTRATION,
    },
    visual: { type: 'approval', phase: 0 },
    map: night('route:1:0:8', out(1), { site: {} }),
    rail: at(7),
  },
  {
    card: {
      title: t('The director makes the final decision'),
      body: t('The Center’s director approves the conclusion, which then proceeds to signing, or rejects it.'),
      note: ILLUSTRATION,
    },
    visual: { type: 'approval', phase: 1 },
    map: night('route:1:0:8', out(1), { site: {} }),
    rail: at(7),
  },

  // Stage 8 — Signing
  {
    card: {
      title: t('Signed with E-IMZO'),
      body: t('The expert and the Center’s director sign the blank with an electronic digital signature. Each signature puts its QR code on the document.'),
      note: ILLUSTRATION,
    },
    visual: { type: 'sign', phase: 0 },
    map: night('route:1:0:8.3', out(1), { site: {} }),
    rail: at(8),
  },
  {
    card: {
      title: t('Delivered digitally through my.gov.uz'),
      body: t('The applicant receives the signed conclusion on the same portal where the application began.'),
      block: { type: 'ticket', issued: true },
    },
    map: {
      cam: 'corridor', camDur: 4600, sat: 1, mask: 0.7, uzb: 0.85, regions: 0.15, nb: 0.25, drift: 0.2,
      route: { dir: 'back', to: 1, head: 'travel', dur: 3.2 }, tashkent: true, site: leaf,
    },
    rail: { show: true, at: 8, done: 8 },
  },
  {
    card: {
      title: t('“Conclusion ready” on the applicant’s phone'),
      body: t('As soon as the conclusion is signed, my.gov.uz notifies the applicant in the personal account.'),
      note: ILLUSTRATION,
    },
    visual: { type: 'phone', phase: 0 },
    map: night('route:0', home, { site: leaf }),
    rail: { show: true, at: 8, done: 8 },
  },
  {
    card: {
      title: t('The signed conclusion, one tap away'),
      body: t('The applicant opens the personal account on my.gov.uz, where the conclusion signed with E-IMZO is ready to download.'),
      note: ILLUSTRATION,
    },
    visual: { type: 'phone', phase: 1 },
    map: night('route:0', home, { site: leaf }),
    rail: { show: true, at: 8, done: 8 },
  },
  {
    card: {
      title: t('Downloaded, opened: the official blank'),
      body: t('The applicant opens the downloaded file: the same official conclusion blank, signed with E-IMZO. Its QR codes let anyone verify it online.'),
      note: t('Illustration; names and TINs are masked, sample values.'),
    },
    visual: { type: 'phone', phase: 2 },
    map: night('route:0', home, { site: leaf }),
    rail: { show: true, at: 8, done: 8 },
  },

  // Finale
  {
    layout: 'top',
    card: { title: t('Start to finish in 15–25 working days'), body: t('Eight stages, one digital system, every action on record.') },
    visual: { type: 'rail', phase: 1 },
    map: { cam: 'country', camDur: 5000, sat: 0.8, mask: 0.65, uzb: 0.28, regions: 0, nb: 0.2, world: 0.1, dim: 0.55, drift: 0.25, site: {} },
  },
  {
    layout: 'hero',
    card: {
      hero: true,
      sub: t('Fully digital. Transparent.<br>Fast and predictable.'),
      sig: [[t('Applications start on my.gov.uz'), 'eco-service.uz'], [t('State Ecological Expertise Center')]],
    },
    map: { cam: 'globe', camDur: 5200, sat: 0.9, mask: 0.6, uzb: 1, world: 0.25, nb: 0, drift: 0.6, site: leaf },
  },
];
