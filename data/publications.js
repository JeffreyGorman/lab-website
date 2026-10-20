// ════════════════════════════════════════════════════════════════
//  PUBLICATIONS — the ONLY file you need to edit to add a paper.
//  (No build step: save this file, refresh the browser.)
//
//  Add a paper by copying one block to the TOP of the list and editing it.
//  The page sorts by year (newest first); within a year, the order here is kept.
//
//    year     : 2026
//    topics   : any of 'dna', 'excitons', 'other'  (the filter chips on the Publications page)
//    title    : the paper title (plain text; <i>…</i> and <sub>…</sub> are allowed)
//    url      : link to the paper (DOI link is best)
//    authors  : plain text. "J. Gorman" (with or without a *) is bolded automatically.
//    journal  : e.g. 'Journal of the American Chemical Society, 148, 8893–8903'  (can be '')
//
//  OPTIONAL animation (see UPDATING.md → "Adding a publication animation"):
//    id       : short unique name, e.g. 'jacs-2026'  (needed if the paper has an animation; used in links)
//    figure   : { file, end, legend, caption }  → animated figure on the Publications page
//        file    : the animated SVG, e.g. 'animations/jacs-2026-figure.svg'
//        end     : length of the animation in seconds
//        legend  : optional colour key shown under the figure:
//                  [ ['photon','PHOTON ABSORBED', 2.8, 3.5], … ]  = [colour, label, lights up at (s), off at (s)]
//                  colours: 'photon' (pink), 'energy' (purple), 'electron' (dark)
//        caption : one or two sentences under the figure
//    card     : { file, end, label }  → show it as a card on the homepage (first 3 papers with a card are used)
//        label   : small heading on the card, e.g. 'JACS (2026)'
//
//  EXAMPLE (a paper with no animation):
//    { year: 2027, topics: ['dna'], title: 'A new paper', url: 'https://doi.org/…',
//      authors: 'A. Student, J. Gorman*', journal: 'Nature, 1, 1–10' },
// ════════════════════════════════════════════════════════════════

window.HIGHLIGHT_AUTHORS = ['J. Gorman'];   // names shown in bold in author lists

window.PUBLICATIONS = [
  {
    year: 2026, topics: ['excitons'],
    title: "Structural properties, polymorphism, and multiscale disorder unravel energy transport limitations in perylene diimide semiconductors",
    url: "https://www.science.org/doi/10.1126/sciadv.aed0037",
    authors: "C. J. H. Smalley, C. E. Hughes, T. Willhammar, R. Pandya, S. K. Saikin, D. N. Johnstone, J. Gorman, J. Sung, G. Jacucci, P. A. Midgley, D. M. Kepaptsoglou, Q. M. Ramasse, A. Rao, K. D. M. Harris, S. M. Collins",
    journal: "Science Advances, 12, eaed0037",
  },
  {
    id: "jacs-2026",
    year: 2026, topics: ['dna', 'excitons'],
    title: "Exploring Size-Controlled Exciton Evolution Using DNA Libraries",
    url: "https://pubs.acs.org/doi/full/10.1021/jacs.5c21113",
    authors: "J. Gorman*, S. Orsborne, P. Budden, A. Sridhar, J. L. Greenfield, D. G. Congrave, R. Pandya, Y. Liu, S. Dowland, S. Ryan, H. Bronstein, J. R. Nitschke, A. Rao, R. Collepardo-Guevara, E. Stulz, F. Auras, R. H. Friend",
    journal: "Journal of the American Chemical Society, 148, 8893–8903",
    figure: {
      file: "animations/jacs-2026-figure.svg", end: 8.0,
      legend: [
        ["photon", "PHOTON ABSORBED", 2.8, 3.5],
        ["energy", "ENERGY TRANSFER", 3.3, 6.9],
        ["electron", "CHARGE TRANSFER", 6.9, 8.0],
      ],
      caption: "The placement of each chromophore in the stack is encoded by DNA. Light is absorbed by oPDI (an ortho-arylated perylene diimide), energy is passed down the pPDI stack (phenoxy-functionalised perylene diimides), then charge transfers to the neighbouring porphyrin.",
    },
    card: { file: "animations/jacs-2026-card.svg", end: 8.0, label: "JACS (2026)" },
  },
  {
    id: "bc-2025",
    year: 2025, topics: ['dna'],
    title: "Heterovalent Click Reactions on DNA Origami",
    url: "https://pubs.acs.org/doi/abs/10.1021/acs.bioconjchem.4c00552",
    authors: "G. A. Knappe, J. Gorman, A. N. Bigley, S. P. Harvey, M. Bathe",
    journal: "Bioconjugate Chemistry, 36, 476-485",
    figure: {
      file: "animations/bc-2025-figure.svg", end: 6.5,
      caption: "Two different enzymes are click-attached to the vertices of an icosahedral DNA origami (heterovalent conjugation), prolonging enzyme stability, here aimed at nerve-agent protection.",
    },
    card: { file: "animations/bc-2025-card.svg", end: 6.5, label: "Bioconjugate Chemistry (2025)" },
  },
  {
    id: "chem-2024",
    year: 2024, topics: ['dna'],
    title: "Sculpting photoproducts with DNA origami",
    url: "https://www.cell.com/chem/fulltext/S2451-9294(24)00116-5",
    authors: "J. Gorman, S. M. Hart, T. John, M. A. Castellanos, D. Harris, M. F. Parsons, J. L. Banal, A. P. Willard, G. S. Schlau-Cohen, M. Bathe",
    journal: "Chem",
    figure: {
      file: "animations/chem-2024-figure.svg", end: 14.3,
      legend: [
        ["photon", "PHOTON ABSORBED", 10.4, 12.5],
        ["electron", "CHARGE TRANSFER", 12.5, 14.3],
      ],
      caption: "A DNA origami holds a PDI dimer inside a six-helix bundle. After light absorption, an electron transfers from one PDI to the other (symmetry-breaking charge transfer). The DNA sets the dimer’s arrangement.",
    },
    card: { file: "animations/chem-2024-card.svg", end: 14.3, label: "Chem (2024)" },
  },
  {
    year: 2024, topics: ['dna'],
    title: "Collaborating with the code of life",
    url: "https://www.cell.com/chem/fulltext/S2451-9294(24)00169-4",
    authors: "J. Gorman",
    journal: "Chem",
  },
  {
    year: 2023, topics: ['dna', 'excitons'],
    title: "Photogeneration of Spin Quintet Triplet–Triplet Excitations in DNA-Assembled Pentacene Stacks",
    url: "https://pubs.acs.org/doi/abs/10.1021/jacs.2c13743",
    authors: "S. R. Orsborne, J. Gorman, L. R. Weiss, A. Sridhar, N. A. Panjwani, G. Divitini, P. Budden, D. Palecek, S. T. Ryan, A. Rao, R. Collepardo-Guevara, A. H. El-Sagheer, T. Brown, J. Behrends, R. H. Friend, F. Auras",
    journal: "Journal of the American Chemical Society",
  },
  {
    year: 2023, topics: ['dna', 'excitons'],
    title: "Engineering exciton dynamics with synthetic DNA scaffolds",
    url: "https://pubs.acs.org/doi/abs/10.1021/acs.accounts.3c00086",
    authors: "S. M. Hart, J. Gorman, M. Bathe, G. S. Schlau-Cohen",
    journal: "Accounts of Chemical Research, 56, 2051-2061",
  },
  {
    year: 2022, topics: ['dna', 'excitons'],
    title: "Activating charge-transfer state formation in strongly-coupled dimers using DNA scaffolds",
    url: "https://pubs.rsc.org/en/content/articlehtml/2022/sc/d2sc02759c",
    authors: "S. M. Hart, J. L. Banal, M. Castellanos, L. Markova, Y. Vyborna, J. Gorman, R. Häner, A. Willard, M. Bathe, G. Schlau-Cohen",
    journal: "Chemical Science",
  },
  {
    year: 2021, topics: ['excitons'],
    title: "Microcavity-like exciton-polaritons can be the primary photoexcitation in bare organic semiconductors",
    url: "https://www.nature.com/articles/s41467-021-26617-w",
    authors: "R. Pandya, R. Y. Chen, Q. Gu, J. Sung, C. Schnedermann, O. S. Ojambati, R. Chikkaraddy, J. Gorman, G. Jacucci, O. D. Onelli, T. Willhammar, D. N. Johnstone, S. M. Collins, P. A. Midgley, F. Auras, T. Baikie, R. Jayaprakash, F. Mathevet, R. Soucek, M. Du, A. M. Alvertis, A. Ashoka, S. Vignolini, D. G. Lidzey, J. J. Baumberg, R. H. Friend, T. Barisien, L. Legrand, A. W. Chin, J. Yuen-Zhou, S. K. Saikin, P. Kukura, A. J. Musser, A. Rao",
    journal: "Nature Communications, 12, 6519",
  },
  {
    year: 2021, topics: ['dna', 'excitons'],
    title: "Deoxyribonucleic acid encoded and size-defined π-stacking of perylene diimides",
    url: "https://pubs.acs.org/doi/abs/10.1021/jacs.1c10241",
    authors: "J. Gorman, S. R. Orsborne, A. Sridhar, R. Pandya, P. Budden, A. Ohmann, N. A. Panjwani, Y. Liu, J. L. Greenfield, S. Dowland, V. Gray, S. T. Ryan, S. D. Ornellas, A. H. El-Sagheer, T. Brown, J. R. Nitschke, J. Behrends, U. F. Keyser, A. Rao, R. Collepardo-Guevara, E. Stulz, R. H. Friend, F. Auras",
    journal: "Journal of the American Chemical Society, 144, 368-376",
  },
  {
    year: 2020, topics: ['excitons'],
    title: "Energy transfer between perylene diimide based ligands and cesium lead bromide perovskite nanocrystals",
    url: "https://pubs.acs.org/doi/abs/10.1021/acs.jpcc.9b11525",
    authors: "A. Rossi, M. B. Price, J. Hardy, J. Gorman, T. W. Schmidt, N. J. Davis",
    journal: "The Journal of Physical Chemistry C, 124, 3306-3313",
  },
  {
    year: 2020, topics: ['excitons'],
    title: "Femtosecond transient absorption microscopy of singlet exciton motion in side-chain engineered perylene-diimide thin films",
    url: "https://pubs.acs.org/doi/abs/10.1021/acs.jpca.0c00346",
    authors: "R. Pandya, R. Y. Chen, Q. Gu, J. Gorman, F. Auras, J. Sung, R. Friend, P. Kukura, C. Schnedermann, A. Rao",
    journal: "The Journal of Physical Chemistry A, 124, 2721-2730",
  },
  {
    year: 2020, topics: ['dna', 'excitons'],
    title: "DNA directed organic semiconductor interactions controlling excitons, charge transfer states, and singlet fission",
    url: "https://www.repository.cam.ac.uk/items/e6ca0dfd-ac58-409e-ae0b-080488d97fad",
    authors: "J. Gorman",
    journal: "PhD thesis, University of Cambridge",
  },
  {
    year: 2019, topics: ['other'],
    title: "Perylene-based covalent organic frameworks for acid vapor sensing",
    url: "https://pubs.acs.org/doi/abs/10.1021/jacs.9b08079",
    authors: "L. Ascherl, E. W. Evans, J. Gorman, S. Orsborne, D. Bessinger, T. Bein, R. H. Friend, F. Auras",
    journal: "Journal of the American Chemical Society, 141, 15693-15699",
  },
  {
    year: 2019, topics: ['excitons'],
    title: "Excimer formation in carboxylic acid-functionalized perylene diimides attached to silicon dioxide nanoparticles",
    url: "https://pubs.acs.org/doi/abs/10.1021/acs.jpcc.8b12061",
    authors: "J. Gorman, R. Pandya, J. R. Allardice, M. B. Price, T. W. Schmidt, R. H. Friend, A. Rao, N. J. Davis",
    journal: "The Journal of Physical Chemistry C, 123, 3433-3440",
  },
  {
    year: 2019, topics: ['excitons'],
    title: "Inter-ligand energy transfer in dye chromophores attached to high bandgap SiO2 nanoparticles",
    url: "https://pubs.rsc.org/en/content/articlehtml/2019/cc/c9cc03412a",
    authors: "M. B. Price, A. Paton, J. Gorman, I. Wagner, G. Laufersky, K. Chen, R. H. Friend, T. W. Schmidt, J. M. Hodgkiss, N. J. Davis",
    journal: "Chemical Communications, 55, 8804-8807",
  },
  {
    year: 2019, topics: ['other'],
    title: "Scan Strategies for Electron Energy Loss Spectroscopy at Optical and Vibrational Energies in Perylene Diimide Nanobelts",
    url: "https://www.cambridge.org/core/journals/microscopy-and-microanalysis/article/scan-strategies-for-electron-energy-loss-spectroscopy-at-optical-and-vibrational-energies-in-perylene-diimide-nanobelts/63C0E3849B8BE1BDA74D71E844043FB4",
    authors: "S. M. Collins, D. M. Kepaptsoglou, D. N. Johnstone, T. Willhammar, R. Pandya, J. Gorman, R. Friend, A. Rao, P. A. Midgley, Q. Ramasse",
    journal: "Microscopy and Microanalysis, 25, 1738-1739",
  },
  {
    year: 2019, topics: ['other'],
    title: "Photoswitchable PROTACs: Visible light activated degradation of the androgen receptor",
    url: "https://scholar.google.com/scholar?cluster=15825835017034373898&hl=en&oi=scholarr",
    authors: "E. Fowler, A. Hock, D. O'Donovan, J. Gorman, G. Fumagalli, R. Friend, D. Spring",
    journal: "",
  },
  {
    year: 2018, topics: ['other'],
    title: "Barbiturate end-capped non-fullerene acceptors for organic solar cells: tuning acceptor energetics to suppress geminate recombination losses",
    url: "https://pubs.rsc.org/en/content/articlehtml/2018/cc/c7cc09123k",
    authors: "C. Tan, J. Gorman, A. Wadsworth, S. Holliday, S. Subramaniyan, S. A. Jenekhe, D. Baran, I. McCulloch, J. R. Durrant",
    journal: "Chemical Communications, 54, 2966-2969",
  },
  {
    year: 2017, topics: ['other'],
    title: "High-performance Organic Photovoltaic Donor Polymers",
    url: "https://books.rsc.org/books/edited-volume/644/chapter/331295",
    authors: "A. Wadsworth, D. Baran, J. Gorman, I. McCulloch",
    journal: "Book chapter, Royal Society of Chemistry",
  },
  {
    year: 2016, topics: ['other'],
    title: "Reduced voltage losses yield 10% efficient fullerene free organic solar cells with> 1 V open circuit voltages",
    url: "https://pubs.rsc.org/en/content/articlehtml/2016/ee/c6ee02598f",
    authors: "D. Baran, T. Kirchartz, S. Wheeler, S. Dimitrov, M. Abdelsamie, J. Gorman, R. S. Ashraf, S. Holliday, A. Wadsworth, N. Gasparini, P. Kaienburg, H. Yan, A. Amassian, C. J. Brabec, J. R. Durrant, I. McCulloch",
    journal: "Energy & Environmental Science, 9, 3783-3793",
  },
];
