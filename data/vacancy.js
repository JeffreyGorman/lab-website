// ─────────────────────────────────────────────────────────────
//  VACANCY  — the PhD advert.  Shown in two places:
//    • a small card on the homepage (above the news strip) that links to the Join page
//    • the full advert at the top of the "PhD Studentships" block on join.html
//
//    tag       : small label, e.g. 'PhD studentship'
//    title     : the project title
//    note      : optional short line under the title on the homepage card (desktop only); '' to hide
//    summary   : a short paragraph for the Join page
//    facts     : rows of [label, text] for the Join page
//    url       : the main button on the Join page ('How to apply')
//    links     : extra buttons on the Join page, as [label, url] pairs (e.g. the FindAPhD listing)
//    page      : where the homepage card goes (the Join page's PhD block)
//    animation : the animated card (an SVG in animations/) shown beside the text on the Join page and as the
//                thumbnail on the homepage; '' for none
//
//  To take the advert DOWN everywhere, change the whole thing to:   window.VACANCY = null;
//  (No build step: save this file, refresh the browser.)
// ─────────────────────────────────────────────────────────────
window.VACANCY = {
  tag: 'PhD studentship',
  title: 'Discovery chemistry for singlet fission materials to retrofit silicon solar cells',
  note: 'Funded · closes 1 Feb 2027 · start Oct 2027',
  summary: 'Make libraries of π-conjugated molecules and test them with a simple photochemical assay (no ultrafast laser needed) to find singlet fission materials that could raise the output of silicon solar panels that are already installed. Designed for graduates in organic or materials chemistry: experience of organic synthesis is strongly preferred, and no photochemistry or solar-cell background is needed.',
  facts: [
    ['Funding', 'Fully funded through the EPSRC ReNU⁺ CDT: tuition fees plus a UKRI-rate stipend (£21,805 a year in 2026/27; part-time at 0.6 FTE also possible). Home-fee students only.'],
    ['Eligible', 'A minimum 2:1 integrated Masters (MChem/MSci) in Chemistry, Natural Sciences or Materials Science, or international equivalent.'],
    ['Deadline', '1 February 2027, 11:59 pm'],
    ['Start', '1 October 2027'],
    ['Supervisor', 'Dr Jeffrey Gorman, Department of Chemistry, Durham University'],
  ],
  url: 'https://www.northumbria.ac.uk/research/postgraduate-research-degrees/studentships/renewable-energy-northeast-universities/apply-now/',
  links: [
    ['FindAPhD listing', 'https://www.findaphd.com/phds/project/discovery-chemistry-for-singlet-fission-materials-to-retrofit-silicon-solar-cells/?p200277'],
  ],
  page: 'join.html#phd',
  animation: 'animations/sf-phd-2027-figure.svg',
};
