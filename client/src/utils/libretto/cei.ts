/**
 * Database CEI per il Rito del Matrimonio.
 *
 * Letture (AT, Tempo Pasquale, NT), Salmi responsoriali, Vangeli — con
 * TESTO COMPLETO (traduzione CEI). Fonte: liturgia.maranatha.it/Matrimonio.
 *
 * Per ogni lettura AT è indicato il `salmoCorrispondente` (numero del salmo
 * abbinato sul lezionario CEI). L'utente sceglie la lettura → l'app
 * preseleziona il salmo abbinato, ma l'utente può sostituirlo da menu.
 */

export type ReadingType = 'at' | 'salmo' | 'nt' | 'vangelo';

export interface ReadingOption {
  id: string;
  type: ReadingType;
  ref: string;
  titolo: string;
  incipit: string;
  testoCompleto?: string;
  ritornello?: string;
  popolare?: boolean;
  /** Numero del salmo corrispondente sul lezionario CEI (solo letture AT). */
  salmoCorrispondente?: number;
}

export const LETTURE_AT: ReadingOption[] = [
  {
    id: 'at-genesi-1-26-28-31a',
    type: 'at',
    ref: 'Gn 1, 26-28.31a',
    titolo: "Dio creò l'uomo a sua immagine: maschio e femmina li creò",
    incipit: `Dio disse: «Facciamo l'uomo a nostra immagine, a nostra somiglianza, e domini sui pesci del mare e sugli uccelli del cielo, sul bestiame, su tutte le...`,
    testoCompleto: `Dio disse: «Facciamo l'uomo a nostra immagine, a nostra somiglianza, e domini sui pesci del mare e sugli uccelli del cielo, sul bestiame, su tutte le bestie selvatiche e su tutti i rettili che strisciano sulla terra». Dio creò l'uomo a sua immagine; a immagine di Dio lo creò; maschio e femmina li creò. Dio li benedisse e disse loro: «Siate fecondi e moltiplicatevi, riempite la terra; soggiogatela e dominate sui pesci del mare e sugli uccelli del cielo e su ogni essere vivente, che striscia sulla terra». Dio vide quanto aveva fatto, ed ecco, era cosa molto buona.`,
    popolare: true,
    salmoCorrispondente: 127,
  },
  {
    id: 'at-genesi-2-18-24',
    type: 'at',
    ref: 'Gn 2, 18-24',
    titolo: "I due saranno una carne sola",
    incipit: `Il Signore Dio disse: «Non è bene che l'uomo sia solo: gli voglio fare un aiuto che gli sia simile». Allora il Signore Dio plasmò dal suolo ogni sorta...`,
    testoCompleto: `Il Signore Dio disse: «Non è bene che l'uomo sia solo: gli voglio fare un aiuto che gli sia simile». Allora il Signore Dio plasmò dal suolo ogni sorta di bestie selvatiche e tutti gli uccelli del cielo e li condusse all'uomo, per vedere come li avrebbe chiamati: in qualunque modo l'uomo avesse chiamato ognuno degli esseri viventi, quello doveva essere il suo nome. Così l'uomo impose nomi a tutto il bestiame, a tutti gli uccelli del cielo e a tutte le bestie selvatiche, ma l'uomo non trovò un aiuto che gli fosse simile. Allora il Signore Dio fece scendere un torpore sull'uomo, che si addormentò; gli tolse una delle costole e rinchiuse la carne al suo posto. Il Signore Dio plasmò con la costola, che aveva tolta all'uomo, una donna e la condusse all'uomo. Allora l'uomo disse: «Questa volta essa è carne dalla mia carnee e osso dalle mie ossa. La si chiamerà donna perché dall'uomo è stata tolta». Per questo l'uomo abbandonerà suo padre e sua madre e si unirà a sua moglie e i due saranno una sola carne.`,
    popolare: true,
    salmoCorrispondente: 148,
  },
  {
    id: 'at-genesi-24-48-51-58-67a',
    type: 'at',
    ref: 'Gn 24, 48-51.58-67a',
    titolo: "Isacco amò Rebecca e trovò conforto dopo la morte della madre",
    incipit: `In quei giorni [il servo di Abramo disse a Labano:] «Benedissi il Signore, Dio del mio padrone Abramo, il quale mi aveva guidato per la via giusta a p...`,
    testoCompleto: `In quei giorni [il servo di Abramo disse a Labano:] «Benedissi il Signore, Dio del mio padrone Abramo, il quale mi aveva guidato per la via giusta a prendere per suo figlio la figlia del fratello del mio padrone. Ora, se intendete usare benevolenza e lealtà verso il mio padrone, fatemelo sapere; se no, fatemelo sapere ugualmente, perché io mi rivolga altrove». Allora Labano e Betuel risposero: «La cosa procede dal Signore, non possiamo dirti nulla. Ecco Rebecca davanti a te: prendila e va' e sia la moglie del figlio del tuo padrone, come ha parlato il Signore». Chiamarono dunque Rebecca e le dissero: «Vuoi partire con quest'uomo?». Essa rispose: «Andrò». Allora essi lasciarono partire Rebecca con la nutrice, insieme con il servo di Abramo e i suoi uomini. Benedissero Rebecca e le dissero: «Tu, sorella nostra, diventa migliaia di miriadi e la tua stirpe conquisti la porta dei suoi nemici!». Così Rebecca e le sue ancelle si alzarono, montarono sui cammelli e seguirono quell'uomo. Il servo prese con sé Rebecca e partì. Intanto Isacco rientrava dal pozzo di Lacai-Roi; abitava infatti nel territorio del Negheb. Isacco uscì sul fare della sera per svagarsi in campagna e, alzando gli occhi, vide venire i cammelli. Alzò gli occhi anche Rebecca, vide Isacco e scese subito dal cammello. E disse al servo: «Chi è quell'uomo che viene attraverso la campagna incontro a noi?». Il servo rispose: «E' il mio padrone». Allora essa prese il velo e si coprì». Il servo raccontò ad Isacco tutte le cose che aveva fatte. Isacco introdusse Rebecca nella tenda che era stata di sua madre Sara; si prese in moglie Rebecca e l'amò.`,
    salmoCorrispondente: 85,
  },
  {
    id: 'at-genesi-29-9-20',
    type: 'at',
    ref: 'Gn 29, 9-20',
    titolo: "A Giacobbe sembrarono pochi i sette anni di servizio, tanto era grande il suo amore per Rachele",
    incipit: `Giacobbe stava ancora parlando [con i pastori], quando arrivò Rachele con il bestiame del padre, perché era una pastorella. Quando Giacobbe vide Rache...`,
    testoCompleto: `Giacobbe stava ancora parlando [con i pastori], quando arrivò Rachele con il bestiame del padre, perché era una pastorella. Quando Giacobbe vide Rachele, figlia di Labano, fratello di sua madre, insieme con il bestiame di Labano, fratello di sua madre, Giacobbe, fattosi avanti, rotolò la pietra dalla bocca del pozzo e fece bere le pecore di Labano, fratello di sua madre. Poi Giacobbe baciò Rachele e pianse ad alta voce. Giacobbe rivelò a Rachele che egli era parente del padre di lei, perché figlio di Rebecca. Allora essa corse a riferirlo al padre. Quando Labano seppe che era Giacobbe, il figlio di sua sorella, gli corse incontro, lo abbracciò, lo baciò e lo condusse nella sua casa. Ed egli raccontò a Labano tutte le sue vicende. Allora Labano gli disse: «Davvero tu sei mio osso e mia carne!». Così dimorò presso di lui per un mese. Poi Labano disse a Giacobbe: «Poiché sei mio parente, mi dovrai forse servire gratuitamente? Indicami quale deve essere il tuo salario». Ora Labano aveva due figlie; la maggiore si chiamava Lia e la più piccola si chiamava Rachele. Lia aveva gli occhi smorti, mentre Rachele era bella di forme e avvenente di aspetto, perciò Giacobbe amava Rachele. Disse dunque: «Io ti servirò sette anni per Rachele, tua figlia minore». Rispose Labano: «Preferisco darla a te piuttosto che a un estraneo. Rimani con me». Così Giacobbe servì sette anni per Rachele: gli sembrarono pochi giorni tanto era il suo amore per lei.`,
    salmoCorrispondente: 126,
  },
  {
    id: 'at-deuteronomio-6-4-9',
    type: 'at',
    ref: 'Dt 6, 4-9',
    titolo: "Sugli stipiti della tua casa e sulle tue porte scrivi: Il Signore è il nostro Dio",
    incipit: `Ascolta, Israele: il Signore è il nostro Dio, il Signore è uno solo. Tu amerai il Signore tuo Dio con tutto il cuore, con tutta l'anima e con tutte le...`,
    testoCompleto: `Ascolta, Israele: il Signore è il nostro Dio, il Signore è uno solo. Tu amerai il Signore tuo Dio con tutto il cuore, con tutta l'anima e con tutte le forze. Questi precetti che oggi ti do, ti stiano fissi nel cuore; li ripeterai ai tuoi figli, ne parlerai quando sarai seduto in casa tua, quando camminerai per via, quando ti coricherai e quando ti alzerai. Te li legherai alla mano come un segno, ti saranno come un pendaglio tra gli occhi e li scriverai sugli stipiti della tua casa e sulle tue porte.`,
    salmoCorrispondente: 99,
  },
  {
    id: 'at-tobia-7-6-14',
    type: 'at',
    ref: 'Tb 7, 6-14',
    titolo: "II Signore vi unisca e adempia in voi la sua benedizione",
    incipit: `In quei giorni, Raguele abbracciò Tobìa e pianse. Poi gli disse: «Sii benedetto, figliolo! Sei il figlio di un ottimo padre. Che sventura per un uomo...`,
    testoCompleto: `In quei giorni, Raguele abbracciò Tobìa e pianse. Poi gli disse: «Sii benedetto, figliolo! Sei il figlio di un ottimo padre. Che sventura per un uomo giusto e largo di elemosine essere diventato cieco!». Si gettò al collo del parente Tobìa e pianse. Pianse anche la moglie Edna e pianse anche la loro figlia Sara. Poi egli macellò un montone del gregge e fece loro una calorosa accoglienza. Si lavarono, fecero le abluzioni e, quando si furono messi a tavola, Tobìa disse a Raffaele: «Fratello Azarìa, domanda a Raguele che mi dia in moglie mia cugina Sara». Raguele udì queste parole e disse al giovane: «Mangia, bevi e sta allegro per questa sera, poiché nessuno all'infuori di te, mio parente, ha il diritto di prendere mia figlia Sara, come del resto neppure io ho la facoltà di darla ad un altro uomo all'infuori di te, poiché tu sei il mio parente più stretto. Però, figlio, vogliono dirti con franchezza la verità. L'ho data a sette mariti, scelti tra i nostri fratelli, e tutti sono morti la notte stessa delle nozze. Ora mangia e bevi, figliolo; il Signore provvederà». Ma Tobìa disse: «Non mangerò affatto né berrò, prima che tu abbia preso una decisione a mio riguardo». Rispose Raguele: «Lo farò! Essa ti viene data secondo il decreto del libro di Mosè e come dal cielo è stato stabilito che ti sia data. Prendi dunque tua cugina, d'ora in poi tu sei suo fratello e lei tua sorella. Ti viene concessa da oggi per sempre. Il Signore del cielo vi assista questa notte, figlio mio, e vi conceda la sua misericordia e la sua pace». Raguele chiamò la figlia Sara e quando essa venne la prese per mano e l'affidò a Tobìa con queste parole: «Prendila; secondo la legge e il decreto scritto nel libro di Mosè ti viene concessa in moglie. Tienila e sana e salva conducila da tuo padre. Il Dio del cielo vi assista con la sua pace». Chiamò poi la madre di lei e le disse di portare un foglio e stese il documento di matrimonio, secondo il quale concedeva in moglie a Tobìa la propria figlia, in base al decreto della legge di Mosè. Dopo di ciò cominciarono a mangiare e a bere.`,
    salmoCorrispondente: 144,
  },
  {
    id: 'at-tobia-8-4b-8',
    type: 'at',
    ref: 'Tb 8, 4b-8',
    titolo: "Preghiamo e domandiamo al Signore che ci dia grazia e salvezza",
    incipit: `[La sera delle nozze] Tobìa si alzò dal letto e disse a Sara: «Sorella, alzati! Preghiamo e domandiamo al Signore che ci dia grazia e salvezza». Essa...`,
    testoCompleto: `[La sera delle nozze] Tobìa si alzò dal letto e disse a Sara: «Sorella, alzati! Preghiamo e domandiamo al Signore che ci dia grazia e salvezza». Essa si alzò e si misero a pregare e a chiedere che venisse su di loro la salvezza, dicendo: «Benedetto sei tu, Dio dei nostri padri, e benedetto per tutte le generazioni è il tuo nome! Ti benedicano i cieli e tutte le creature per tutti i secoli! Tu hai creato Adamo e hai creato Eva sua moglie, perché gli fosse di aiuto e di sostegno. Da loro due nacque tutto il genere umano. Tu hai detto: non è cosa buona che l'uomo resti solo; facciamogli un aiuto simile a lui. Ora non per lussuria io prendo questa mia parente, ma con rettitudine d'intenzione. Degnati di aver misericordia di me e di lei e di farci giungere insieme alla vecchiaia». E dissero insieme: «Amen, amen!».`,
    popolare: true,
    salmoCorrispondente: 102,
  },
  {
    id: 'at-proverbi-31-10-13-19-20-30-31',
    type: 'at',
    ref: 'Pr 31, 10-13.19-20.30-31',
    titolo: "La donna che teme Dio è da lodare",
    incipit: `Una donna perfetta chi potrà trovarla? Ben superiore alle perle è il suo valore. In lei confida il cuore del marito e non verrà a mancargli il profitt...`,
    testoCompleto: `Una donna perfetta chi potrà trovarla? Ben superiore alle perle è il suo valore. In lei confida il cuore del marito e non verrà a mancargli il profitto. Essa gli da felicità e non dispiacere per tutti i giorni della sua vita. Si procura lana e lino e li lavora volentieri con le mani. Stende la sua mano alla conocchia e mena il fuso con le dita. Apre le sue mani al misero, stende la mano al povero. Fallace è la grazia e vana è la bellezza, ma la donna che teme Dio è da lodare. Datele del frutto delle sue mani e le sue stesse opere la lodino alle porte della città.`,
    salmoCorrispondente: 111,
  },
  {
    id: 'at-cantico-2-8-10-14-16a-8-6-7a',
    type: 'at',
    ref: 'Ct 2, 8-10.14.16a; 8, 6-7a',
    titolo: "Forte come la morte è l'amore",
    incipit: `Una voce! Il mio diletto! Eccolo, viene saltando per i monti, balzando per le colline. Somiglia il mio diletto a un capriolo o ad un cerbiatto. Eccolo...`,
    testoCompleto: `Una voce! Il mio diletto! Eccolo, viene saltando per i monti, balzando per le colline. Somiglia il mio diletto a un capriolo o ad un cerbiatto. Eccolo, egli sta dietro il nostro muro; guarda dalla finestra, spia attraverso le inferriate. Ora parla il mio diletto e mi dice: «Alzati, amica mia, mia bella, e vieni! O mia colomba, che stai nelle fenditure della roccia, nei nascondigli dei dirupi, mostrami il tuo viso, fammi sentire la tua voce, perché la tua voce è soave, il tuo viso è leggiadro». Il mio diletto è per me e io per lui. [Egli mi dice:] «Mettimi come sigillo sul tuo cuore, come sigillo sul tuo braccio; perché forte come la morte è l'amore, tenace come gli inferi è la passione: le sue vampe sono vampe di fuoco, una fiamma del Signore! Le grandi acque non possono spegnere l'amore né i fiumi travolgerlo».`,
    popolare: true,
    salmoCorrispondente: 44,
  },
  {
    id: 'at-siracide-26-1-4-13-16',
    type: 'at',
    ref: 'Sir 26, 1-4.13-16',
    titolo: "La bellezza di una donna virtuosa adorna la sua casa",
    incipit: `Beato il marito di una donna virtuosa; il numero dei suoi giorni sarà doppio. Una brava moglie è la gioia del marito, questi trascorrerà gli anni in p...`,
    testoCompleto: `Beato il marito di una donna virtuosa; il numero dei suoi giorni sarà doppio. Una brava moglie è la gioia del marito, questi trascorrerà gli anni in pace. Una donna virtuosa è una buona sorte, viene assegnata a chi teme il Signore. Ricco o povero il cuore di lui ne gioisce, in ogni tempo il suo volto appare sereno. La grazia di una donna allieta il marito, la sua scienza gli rinvigorisce le ossa. E' un dono del Signore una donna silenziosa, non c'è compenso per una donna educata. Grazia su grazia è una donna pudica, non si può valutare il peso di un'anima modesta. Il sole risplende sulle montagne del Signore, la bellezza di una donna virtuosa adorna la sua casa.`,
    salmoCorrispondente: 111,
  },
  {
    id: 'at-isaia-54-5-10',
    type: 'at',
    ref: 'Is 54, 5-10',
    titolo: "Anche se i monti si spostassero, non si allontanerebbe da te il mio affetto",
    incipit: `Tuo sposo è il tuo creatore, Signore degli eserciti è il suo nome; tuo redentore è il Santo di Israele, è chiamato Dio di tutta la terra. Come una don...`,
    testoCompleto: `Tuo sposo è il tuo creatore, Signore degli eserciti è il suo nome; tuo redentore è il Santo di Israele, è chiamato Dio di tutta la terra. Come una donna abbandonata e con l'animo afflitto, ti ha il Signore richiamata. Viene forse ripudiata la donna sposata in gioventù? Dice il tuo Dio. Per un breve istante ti ho abbandonata, ma ti riprenderò con immenso amore. In un impeto di collera ti ho nascosto per un poco il mio volto; ma con affetto perenne ho avuto pietà di te, dice il tuo redentore, il Signore. Ora è per me come ai giorni di Noè, quando giurai che non avrei più riversato le acque di Noè sulla terra; così ora giuro di non più adirarmi con te e di non farti più minacce. Anche se i monti si spostassero e i colli vacillassero, non si allontanerebbe da te il mio affetto, né vacillerebbe la mia alleanza di pace; dice il Signore che ti usa misericordia.`,
    salmoCorrispondente: 120,
  },
  {
    id: 'at-isaia-62-1-5',
    type: 'at',
    ref: 'Is 62, 1-5',
    titolo: "Come gioisce lo sposo per la sposa, così il tuo Dio gioirà per te",
    incipit: `Per amore di Sion non tacerò, per amore di Gerusalemme non mi darò pace, finché non sorga come stella la sua giustizia e la sua salvezza non risplenda...`,
    testoCompleto: `Per amore di Sion non tacerò, per amore di Gerusalemme non mi darò pace, finché non sorga come stella la sua giustizia e la sua salvezza non risplenda come lampada. Allora i popoli vedranno la tua giustizia, tutti i re la tua gloria; ti si chiamerà con un nome nuovo che la bocca del Signore indicherà. Sarai una magnifica corona nella mano del Signore, un diadema regale nella palma del tuo Dio. Nessuno ti chiamerà più Abbandonata, né la tua terra sarà più detta Devastata, ma tu sarai chiamata Mio compiacimento e la tua terra, Sposata, perché il Signore si compiacerà di te e la tua terra avrà uno sposo. Sì, come un giovane sposa una vergine, così ti sposerà il tuo architetto; come gioisce lo sposo per la sposa, così il tuo Dio gioirà per te.`,
    salmoCorrispondente: 32,
  },
  {
    id: 'at-geremia-31-31-32a-33-34a',
    type: 'at',
    ref: 'Ger 31, 31-32a.33-34a',
    titolo: "Concluderò con la casa d'Israele e con la casa di Giuda un alleanza nuova",
    incipit: `Ecco verranno giorni - dice il Signore - nei quali con la casa di Israele e con la casa di Giuda io concluderò una alleanza nuova. Non come l'alleanza...`,
    testoCompleto: `Ecco verranno giorni - dice il Signore - nei quali con la casa di Israele e con la casa di Giuda io concluderò una alleanza nuova. Non come l'alleanza che ho conclusa con i loro padri, quando li presi per mano per farli uscire dal paese d'Egitto.`,
    salmoCorrispondente: 85,
  },
  {
    id: 'at-ezechiele-16-3-14',
    type: 'at',
    ref: 'Ez 16, 3-14',
    titolo: "Passai vicino a te",
    incipit: `Ti vidi e ti amai. Così dice il Signore Dio a Gerusalemme: «Tu sei, per origine e nascita, del paese dei Cananei; tuo padre era Amorreo e tua madre Hi...`,
    testoCompleto: `Ti vidi e ti amai. Così dice il Signore Dio a Gerusalemme: «Tu sei, per origine e nascita, del paese dei Cananei; tuo padre era Amorreo e tua madre Hittita. Alla tua nascita, quando fosti partorita, non ti fu tagliato l'ombelico e non fosti lavata con l'acqua per purificarti; non ti fecero le frizioni di sale, né fosti avvolta in fasce. Occhio pietoso non si volse su di te per farti una sola di queste cose e usarti compassione, ma come oggetto ripugnante fosti gettata via in piena campagna, il giorno della tua nascita. Passai vicino a te e ti vidi mentre ti dibattevi nel sangue e ti dissi: Vivi nel tuo sangue e cresci come l'erba del campo. Crescesti e ti facesti grande e giungesti al fiore della giovinezza: il tuo petto divenne fiorente ed eri giunta ormai alla pubertà; ma eri nuda e scoperta. Passai vicino a te e ti vidi; ecco, la tua età era l'età dell'amore; io stesi il lembo del mio mantello su di te e coprii la tua nudità; giurai alleanza con te, dice il Signore Dio, e divenisti mia. Ti lavai con acqua, ti ripulii del sangue e ti unsi con olio. Ti vestii di ricami, ti calzai di pelle di tasso, ti cinsi il capo di bisso e ti ricoprii di seta. Ti adornai di gioielli: ti misi braccialetti ai polsi e una collana al collo; misi al tuo naso un anello, orecchini agli orecchi e una splendida corona sul tuo capo. Così fosti adorna d'oro e d'argento; le tue vesti erano di bisso, di seta e ricami; fior di farina e miele e olio furono il tuo cibo; diventasti sempre più bella e giungesti fino ad esser regina. La tua fama si diffuse fra le genti per la tua bellezza, che era perfetta, per la gloria che io avevo posta in te, parola del Signore Dio».`,
    salmoCorrispondente: 138,
  },
  {
    id: 'at-ezechiele-36-24-28',
    type: 'at',
    ref: 'Ez 36, 24-28',
    titolo: "Porrò il mio spirito dentro di voi",
    incipit: `Vi prenderò dalle genti, [dice il Signore,] vi radunerò da ogni terra e vi condurrò sul vostro suolo. Vi aspergerò con acqua pura e sarete purificati;...`,
    testoCompleto: `Vi prenderò dalle genti, [dice il Signore,] vi radunerò da ogni terra e vi condurrò sul vostro suolo. Vi aspergerò con acqua pura e sarete purificati; io vi purificherò da tutte le vostre sozzure e da tutti i vostri idoli; vi darò un cuore nuovo, metterò dentro di voi uno spirito nuovo, toglierò da voi il cuore di pietra e vi darò un cuore di carne. Porrò il mio spirito dentro di voi e vi farò vivere secondo i miei statuti e vi farò osservare e mettere in pratica le mie leggi. Abiterete nella terra che io diedi ai vostri padri; voi sarete il mio popolo e io sarò il vostro Dio.`,
    salmoCorrispondente: 45,
  },
  {
    id: 'at-osea-2-16-17b-22',
    type: 'at',
    ref: 'Os 2, 16.17b-22',
    titolo: "Nella benevolenza e nell'amore tu conoscerai il Signore",
    incipit: `[Così dice il Signore:] «Ecco, la attirerò a me, la condurrò nel deserto e parlerò al suo cuore; là canterà come nei giorni della sua giovinezza, come...`,
    testoCompleto: `[Così dice il Signore:] «Ecco, la attirerò a me, la condurrò nel deserto e parlerò al suo cuore; là canterà come nei giorni della sua giovinezza, come quando uscì dal paese d'Egitto. E avverrà in quel giorno - oracolo del Signore - mi chiamerai: Marito mio, e non mi chiamerai più: Mio padrone. Le toglierò dalla bocca i nomi dei Baal, che non saranno più ricordati. In quel tempo farò per loro un'alleanza con le bestie della terra e gli uccelli del cielo e con i rettili del suolo; arco e spada e guerra eliminerò dal paese; e li farò riposare tranquilli. Ti farò mia sposa per sempre, ti farò mia sposa nella giustizia e nel diritto, nella benevolenza e nell'amore, ti fidanzerò con me nella fedeltà e tu conoscerai il Signore».`,
    salmoCorrispondente: 39,
  },
];

export const LETTURE_TEMPO_PASQUALE: ReadingOption[] = [
  {
    id: 'tp-atti-1-12-14',
    type: 'at',
    ref: 'At 1, 12-14',
    titolo: "Erano assidui e concordi nella preghiera, con Maria",
    incipit: `[Dopo che Gesù fu assunto in cielo, gli apostoli] ritornarono a Gerusalemme dal monte detto degli Ulivi, che è vicino a Gerusalemme quanto il cammino...`,
    testoCompleto: `[Dopo che Gesù fu assunto in cielo, gli apostoli] ritornarono a Gerusalemme dal monte detto degli Ulivi, che è vicino a Gerusalemme quanto il cammino permesso in un sabato. Entrati in città salirono al piano superiore dove abitavano. C'erano Pietro e Giovanni, Giacomo e Andrea, Filippo e Tommaso, Bartolomeo e Matteo, Giacomo di Alfeo e Simone lo Zelòta e Giuda di Giacomo. Tutti questi erano assidui e concordi nella preghiera, insieme con alcune donne e con Maria, la madre di Gesù e con i fratelli di lui.`,
    salmoCorrispondente: 148,
  },
  {
    id: 'tp-atti-2-42-48',
    type: 'at',
    ref: 'At 2, 42-48',
    titolo: "Spezzavano il pane nelle loro case",
    incipit: `[Quelli che erano stati battezzati] erano assidui nell'ascoltare l'insegnamento degli apostoli e nell'unione fraterna, nella frazione del pane e nelle...`,
    testoCompleto: `[Quelli che erano stati battezzati] erano assidui nell'ascoltare l'insegnamento degli apostoli e nell'unione fraterna, nella frazione del pane e nelle preghiere. Un senso di timore era in tutti e prodigi e segni avvenivano per opera degli apostoli. Tutti coloro che erano diventati credenti stavano insieme e tenevano ogni cosa in comune; chi aveva proprietà e sostanze le vendeva e ne faceva parte a tutti, secondo il bisogno di ciascuno. Ogni giorno tutti insieme frequentavano il tempio e spezzavano il pane a casa prendendo i pasti con letizia e semplicità di cuore, lodando Dio e godendo la stima di tutto il popolo. Intanto il Signore ogni giorno aggiungeva alla comunità quelli che erano salvati.`,
    salmoCorrispondente: 99,
  },
  {
    id: 'tp-apocalisse-5-8-10',
    type: 'at',
    ref: 'Ap 5, 8-10',
    titolo: 'Li ha costituiti per il nostro Dio come regno di sacerdoti',
    incipit: `I quattro esseri viventi e i ventiquattro vegliardi si prostrarono davanti all'Agnello, avendo ciascuno un'arpa e coppe d'oro...`,
    testoCompleto: `I quattro esseri viventi e i ventiquattro vegliardi si prostrarono davanti all'Agnello, avendo ciascuno un'arpa e coppe d'oro colme di profumi, che sono le preghiere dei santi. Cantavano un canto nuovo: «Tu sei degno di prendere il libro e di aprirne i sigilli, perché sei stato immolato e hai riscattato per Dio con il tuo sangue uomini di ogni tribù, lingua, popolo e nazione e li hai costituiti per il nostro Dio un regno di sacerdoti e regneranno sopra la terra».`,
    salmoCorrispondente: 32,
  },
  {
    id: 'tp-apocalisse-19-1-5-9a',
    type: 'at',
    ref: 'Ap 19, 1.5-9a',
    titolo: "Beati gli invitati al banchetto delle nozze dell'Agnello",
    incipit: `Io, Giovanni, udii come una voce potente di una folla immensa nel cielo che diceva: «Alleluia! Salvezza, gloria e potenza...`,
    testoCompleto: `Io, Giovanni, udii come una voce potente di una folla immensa nel cielo che diceva: «Alleluia! Salvezza, gloria e potenza sono del nostro Dio». Partì dal trono una voce che diceva: «Lodate il nostro Dio, voi tutti, suoi servi, voi che lo temete, piccoli e grandi!». Udii poi come una voce di una immensa folla simile a fragore di grandi acque e a rombo di tuoni possenti, che gridavano: «Alleluia. Ha preso possesso del suo regno il Signore, il nostro Dio, l'Onnipotente. Rallegriamoci ed esultiamo, rendiamo a lui gloria, perché son giunte le nozze dell'Agnello; la sua sposa è pronta, le hanno dato una veste di lino puro splendente». La veste di lino sono le opere giuste dei santi. Allora l'angelo mi disse: «Scrivi: Beati gli invitati al banchetto delle nozze dell'Agnello!».`,
    salmoCorrispondente: 44,
  },
  {
    id: 'tp-apocalisse-21-1-5a',
    type: 'at',
    ref: 'Ap 21, 1-5a',
    titolo: 'Come sposa adorna per il suo sposo',
    incipit: `Io, Giovanni, vidi poi un nuovo cielo e una nuova terra, perché il cielo e la terra di prima erano scomparsi e il mare non...`,
    testoCompleto: `Io, Giovanni, vidi poi un nuovo cielo e una nuova terra, perché il cielo e la terra di prima erano scomparsi e il mare non c'era più. Vidi anche la città santa, la nuova Gerusalemme, scendere dal cielo, da Dio, pronta come una sposa adorna per il suo sposo. Udii allora una voce potente che usciva dal trono: «Ecco la dimora di Dio con gli uomini! Egli dimorerà tra di loro ed essi saranno suo popolo ed egli sarà il "Dio-con-loro". E tergerà ogni lacrima dai loro occhi; non ci sarà più la morte, né lutto, né lamento, né affanno, perché le cose di prima sono passate». E Colui che sedeva sul trono disse: «Ecco, io faccio nuove tutte le cose».`,
    salmoCorrispondente: 32,
  },
  {
    id: 'tp-apocalisse-22-16-17-20',
    type: 'at',
    ref: 'Ap 22, 16-17.20',
    titolo: 'Lo Spirito e la sposa dicono: Vieni!',
    incipit: `Io, Giovanni, udii una voce che mi diceva: «Io, Gesù, ho mandato il mio angelo, per testimoniare a voi queste cose...`,
    testoCompleto: `Io, Giovanni, udii una voce che mi diceva: «Io, Gesù, ho mandato il mio angelo, per testimoniare a voi queste cose riguardo alle Chiese. Io sono la radice della stirpe di Davide, la stella radiosa del mattino». Lo Spirito e la sposa dicono: «Vieni!». E chi ascolta ripeta: «Vieni!». Chi ha sete venga; chi vuole attinga gratuitamente l'acqua della vita. Colui che attesta queste cose dice: «Sì, verrò presto!». Amen, Vieni, Signore Gesù. La grazia del Signore Gesù sia con tutti voi. Amen!`,
    salmoCorrispondente: 44,
  },
];

export const SALMI: ReadingOption[] = [
  {
    id: 'sal-32',
    type: 'salmo',
    ref: 'Sal 32',
    titolo: `Nel Signore gioisca il nostro cuore`,
    incipit: `Nel Signore gioisca il nostro cuore`,
    ritornello: `Nel Signore gioisca il nostro cuore.`,
    testoCompleto: `R. Nel Signore gioisca il nostro cuore.

Beata la nazione il cui Dio è il Signore,
il popolo che si è scelto come erede.
Ecco, l'occhio del Signore veglia su chi lo teme,
su chi spera nella sua grazia.

R. Nel Signore gioisca il nostro cuore.

L'anima nostra attende il Signore,
egli è nostro aiuto e nostro scudo.
In lui gioisce il nostro cuore
e confidiamo nel suo santo nome.

R. Nel Signore gioisca il nostro cuore.

Signore, sia su di noi la tua grazia,
perché in te speriamo.

R. Nel Signore gioisca il nostro cuore.`,
    popolare: true,
  },
  {
    id: 'sal-33',
    type: 'salmo',
    ref: 'Sal 33',
    titolo: `Benediciamo insieme il nome del Signore`,
    incipit: `Benediciamo insieme il nome del Signore`,
    ritornello: `Benediciamo insieme il nome del Signore.`,
    testoCompleto: `R. Benediciamo insieme il nome del Signore.

Benedirò il Signore in ogni tempo,
sulla mia bocca sempre la sua lode.
Io mi glorio nel Signore,
ascoltino gli umili e si rallegrino.

R. Benediciamo insieme il nome del Signore.

Celebrate con me il Signore,
esaltiamo insieme il suo nome.
Ho cercato il Signore e mi ha risposto
e da ogni timore mi ha liberato.

R. Benediciamo insieme il nome del Signore.

Guardate a lui e sarete raggianti,
non saranno confusi i vostri volti.
Questo povero grida e il Signore lo ascolta,
lo libera da tutte le sue angosce.

R. Benediciamo insieme il nome del Signore.

L'angelo del Signore si accampa
attorno a quelli che lo temono e li salva.
Gustate e vedete quanto è buono il Signore;
beato l'uomo che in lui si rifugia.

R. Benediciamo insieme il nome del Signore.`,
  },
  {
    id: 'sal-39',
    type: 'salmo',
    ref: 'Sal 39',
    titolo: `Siamo pronti, Signore, a fare la tua volontà`,
    incipit: `Siamo pronti, Signore, a fare la tua volontà`,
    ritornello: `Siamo pronti, Signore, a fare la tua volontà.`,
    testoCompleto: `R. Siamo pronti, Signore, a fare la tua volontà.

Ho sperato: ho sperato nel Signore ed egli su di me si è chinato, ha dato ascolto al mio grido. Mi ha messo sulla bocca un canto nuovo, lode al nostro Dio.

R. Siamo pronti, Signore, a fare la tua volontà.

Quanti prodigi tu hai fatto, Signore Dio mio, quali disegni in nostro favore: nessuno a te si può paragonare. Se li voglio annunziare e proclamare sono troppi per essere contati.

R. Siamo pronti, Signore, a fare la tua volontà.

Sacrificio e offerta non gradisci, gli orecchi mi hai aperto. Non hai chiesto olocausto e vittima per la colpa. Allora ho detto: «Ecco, io vengo».

R. Siamo pronti, Signore, a fare la tua volontà.

«Sul rotolo del libro di me è scritto, che io faccia il tuo volere. Mio Dio, questo io desidero, la tua legge è nel profondo del mio cuore».

R. Siamo pronti, Signore, a fare la tua volontà.

Ho annunziato la tua giustizia nella grande assemblea; vedi, non tengo chiuse le labbra, Signore, tu lo sai. Non ho nascosto la tua giustizia in fondo al cuore, la tua fedeltà e la tua salvezza ho proclamato.

R. Siamo pronti, Signore, a fare la tua volontà.`,
  },
  {
    id: 'sal-44',
    type: 'salmo',
    ref: 'Sal 44',
    titolo: `Sia con noi ogni giorno la bontà del nostro Dio`,
    incipit: `Sia con noi ogni giorno la bontà del nostro Dio`,
    ritornello: `Sia con noi ogni giorno la bontà del nostro Dio.`,
    testoCompleto: `R. Sia con noi ogni giorno la bontà del nostro Dio.

Effonde il mio cuore liete parole, io canto al re il mio poema. La mia lingua è stilo di scriba veloce.

R. Sia con noi ogni giorno la bontà del nostro Dio.

Tu sei il più bello tra i figli dell'uomo, sulle tue labbra è diffusa la grazia, ti ha benedetto Dio per sempre. Cingi, prode, la spada al tuo fianco, nello splendore della tua maestà ti arrida la sorte.

R. Sia con noi ogni giorno la bontà del nostro Dio.

Avanza per la verità, la mitezza e la giustizia. Ami la giustizia e l'empietà detesti: Dio, il tuo Dio ti ha consacrato.

R. Sia con noi ogni giorno la bontà del nostro Dio.

Ascolta, figlia, guarda, porgi l'orecchio, dimentica il tuo popolo e la casa di tuo padre; al re piacerà la tua bellezza. Egli è il tuo Signore: pròstrati a lui.

R. Sia con noi ogni giorno la bontà del nostro Dio.

Da Tiro vengono portando doni, i più ricchi del popolo cercano il tuo volto. La figlia del re è tutta splendore, gemme e tessuto d'oro è il suo vestito.

R. Sia con noi ogni giorno la bontà del nostro Dio.`,
  },
  {
    id: 'sal-45',
    type: 'salmo',
    ref: 'Sal 45',
    titolo: `Dio è per noi rifugio e forza`,
    incipit: `Dio è per noi rifugio e forza`,
    ritornello: `Dio è per noi rifugio e forza.`,
    testoCompleto: `R. Dio è per noi rifugio e forza.

Dio è per noi rifugio e forza, aiuto sempre vicino nelle angosce. Perciò non temiamo se trema la terra, se crollano i monti nel fondo del mare.

R. Dio è per noi rifugio e forza.

Il Signore degli eserciti è con noi, nostro rifugio è il Dio di Giacobbe. Venite, vedete le opere del Signore, egli ha fatto portenti sulla terra.

R. Dio è per noi rifugio e forza.

Fermatevi e sappiate che io sono Dio, eccelso tra le genti, eccelso sulla terra. Il Signore degli eserciti è con noi, nostro rifugio è il Dio di Giacobbe.

R. Dio è per noi rifugio e forza.`,
  },
  {
    id: 'sal-60',
    type: 'salmo',
    ref: 'Sal 60',
    titolo: `All'ombra delle tue ali troverò riparo`,
    incipit: `All'ombra delle tue ali troverò riparo`,
    ritornello: `All'ombra delle tue ali troverò riparo.`,
    testoCompleto: `R. All'ombra delle tue ali troverò riparo.

Ascolta, o Dio, il mio grido, sii attento alla mia preghiera. Dai confini della terra io t'invoco; mentre il mio cuore viene meno, guidami su rupe inaccessibile.

R. All'ombra delle tue ali troverò riparo.

Tu sei per me rifugio, torre salda davanti all'avversario. Dimorerò nella tua tenda per sempre, all'ombra delle tue ali troverò riparo.

R. All'ombra delle tue ali troverò riparo.

Allora canterò inni al tuo nome, sempre, sciogliendo i miei voti giorno per giorno.

R. All'ombra delle tue ali troverò riparo.`,
  },
  {
    id: 'sal-85',
    type: 'salmo',
    ref: 'Sal 85',
    titolo: `Mostraci, Signore, la tua via`,
    incipit: `Mostraci, Signore, la tua via`,
    ritornello: `Mostraci, Signore, la tua via.`,
    testoCompleto: `R. Mostraci, Signore, la tua via.

Mostrami, Signore, la tua via, perché nella tua verità io cammini; donami un cuore semplice che tema il tuo nome.

R. Mostraci, Signore, la tua via.

Ti loderò, Signore, Dio mio, con tutto il cuore e darò gloria al tuo nome sempre, perché grande con me è la tua misericordia.

R. Mostraci, Signore, la tua via.

Ma tu, Signore, Dio di pietà, compassionevole, lento all'ira e pieno di amore, Dio fedele, volgiti a me e abbi misericordia: dona al tuo servo la tua forza.

R. Mostraci, Signore, la tua via.`,
  },
  {
    id: 'sal-99',
    type: 'salmo',
    ref: 'Sal 99',
    titolo: `Eterno è il suo amore per noi; eterna è la sua fedeltà`,
    incipit: `Eterno è il suo amore per noi; eterna è la sua fedeltà`,
    ritornello: `Eterno è il suo amore per noi; eterna è la sua fedeltà.`,
    testoCompleto: `R. Eterno è il suo amore per noi; eterna è la sua fedeltà.

Acclamate al Signore, voi tutti della terra, servite il Signore nella gioia, presentatevi a lui con esultanza.

R. Eterno è il suo amore per noi; eterna è la sua fedeltà.

Riconoscete che il Signore è Dio; egli ci ha fatti e noi siamo suoi, suo popolo e gregge del suo pascolo.

R. Eterno è il suo amore per noi; eterna è la sua fedeltà.

Varcate le sue porte con inni di grazie, i suoi atri con canti di lode, lodatelo, benedite il suo nome.

R. Eterno è il suo amore per noi; eterna è la sua fedeltà.

Poiché buono è il Signore, eterna la sua misericordia, la sua fedeltà per ogni generazione.

R. Eterno è il suo amore per noi; eterna è la sua fedeltà.`,
  },
  {
    id: 'sal-102',
    type: 'salmo',
    ref: 'Sal 102',
    titolo: `La grazia del Signore è da sempre: dura in eterno`,
    incipit: `La grazia del Signore è da sempre: dura in eterno`,
    ritornello: `La grazia del Signore è da sempre: dura in eterno.`,
    testoCompleto: `R. La grazia del Signore è da sempre: dura in eterno.

Benedici il Signore, anima mia, quanto è in me benedica il suo santo nome. Benedici il Signore, anima mia, non dimenticare tanti suoi benefici.

R. La grazia del Signore è da sempre: dura in eterno.

Buono e pietoso è il Signore, lento all'ira e grande nell'amore. Come un padre ha pietà dei suoi figli, così il Signore ha pietà di quanti lo temono.

R. La grazia del Signore è da sempre: dura in eterno.

La grazia del Signore è da sempre, dura in eterno per quanti lo temono; la sua giustizia per i figli dei figli, per quanti custodiscono la sua alleanza.

R. La grazia del Signore è da sempre: dura in eterno.`,
    popolare: true,
  },
  {
    id: 'sal-111',
    type: 'salmo',
    ref: 'Sal 111',
    titolo: `Beato chi cammina nella legge del Signore`,
    incipit: `Beato chi cammina nella legge del Signore`,
    ritornello: `Beato chi cammina nella legge del Signore.`,
    testoCompleto: `R. Beato chi cammina nella legge del Signore.

Beato l'uomo che teme il Signore e trova grande gioia nei suoi comandamenti. Potente sulla terra sarà la sua stirpe, la discendenza dei giusti sarà benedetta.

R. Beato chi cammina nella legge del Signore.

Onore e ricchezza nella sua casa, la sua giustizia rimane per sempre. Spunta nelle tenebre come luce per i giusti, buono, misericordioso e giusto.

R. Beato chi cammina nella legge del Signore.

Felice l'uomo pietoso che da in prestito, amministra i suoi beni con giustizia. Non temerà annunzio di sventura.

R. Beato chi cammina nella legge del Signore.

Saldo è il suo cuore, confida nel Signore. Sicuro è il suo cuore, non teme, finché trionferà dei suoi nemici.

R. Beato chi cammina nella legge del Signore.

Egli dona largamente ai poveri, la sua giustizia rimane per sempre, la sua potenza s'innalza nella gloria.

R. Beato chi cammina nella legge del Signore.

Dal.

R. Beato chi cammina nella legge del Signore.`,
  },
  {
    id: 'sal-120',
    type: 'salmo',
    ref: 'Sal 120',
    titolo: `Veglia su di voi il Signore e vi protegge`,
    incipit: `Veglia su di voi il Signore e vi protegge`,
    ritornello: `Veglia su di voi il Signore e vi protegge.`,
    testoCompleto: `R. Veglia su di voi il Signore e vi protegge.

Alzo gli occhi verso i monti: da dove mi verrà l'aiuto? Il mio aiuto viene dal Signore, che ha fatto cielo e terra.

R. Veglia su di voi il Signore e vi protegge.

Non lascerà vacillare il tuo piede, non si addormenterà il tuo custode. Non si addormenterà, non prenderà sonno, il custode d'Israele.

R. Veglia su di voi il Signore e vi protegge.

Il Signore è il tuo custode, il Signore è come ombra che ti copre, e sta alla tua destra. Di giorno non ti colpirà il sole, né la luna di notte.

R. Veglia su di voi il Signore e vi protegge.

Il Signore ti proteggerà da ogni male, egli proteggerà la tua vita. Il Signore veglierà su di te, quando esci e quando entri, da ora e per sempre.

R. Veglia su di voi il Signore e vi protegge.`,
  },
  {
    id: 'sal-126',
    type: 'salmo',
    ref: 'Sal 126',
    titolo: `Sono dono del Signore i figli`,
    incipit: `Sono dono del Signore i figli`,
    ritornello: `Sono dono del Signore i figli.`,
    testoCompleto: `R. Sono dono del Signore i figli.

Se il Signore non costruisce la casa, invano faticano i costruttori. Se il Signore non costruisce la casa, invano vi faticano i costruttori. Se il Signore non custodisce la città, invano veglia il custode.

R. Sono dono del Signore i figli.

Invano vi alzate di buon mattino, tardi andate a riposare e mangiate pane di sudore: il Signore ne darà ai suoi amici nel sonno.

R. Sono dono del Signore i figli.

Ecco, dono del Signore sono i figli, è sua grazia il frutto del grembo. Come frecce in mano a un eroe sono i figli della giovinezza.

R. Sono dono del Signore i figli.`,
  },
  {
    id: 'sal-127',
    type: 'salmo',
    ref: 'Sal 127',
    titolo: `Sarà benedetto chi teme il Signore`,
    incipit: `Sarà benedetto chi teme il Signore`,
    ritornello: `Sarà benedetto chi teme il Signore.`,
    testoCompleto: `R. Sarà benedetto chi teme il Signore.

Beato l'uomo che teme il Signore e cammina nelle sue vie. Vivrai del lavoro delle tue mani, sarai felice e godrai d'ogni bene.

R. Sarà benedetto chi teme il Signore.

La tua sposa come vite feconda nell'intimità della tua casa; i tuoi figli come virgulti d'ulivo intorno alla tua mensa.

R. Sarà benedetto chi teme il Signore.

Così sarà benedetto l'uomo che teme il Signore, Ti benedica il Signore da Sion! Possa tu vedere la prosperità di Gerusalemme per tutti i giorni della tua vita.

R. Sarà benedetto chi teme il Signore.`,
    popolare: true,
  },
  {
    id: 'sal-130',
    type: 'salmo',
    ref: 'Sal 130',
    titolo: `Proteggimi, o Dio: in te mi rifugio`,
    incipit: `Proteggimi, o Dio: in te mi rifugio`,
    ritornello: `Proteggimi, o Dio: in te mi rifugio.`,
    testoCompleto: `R. Proteggimi, o Dio: in te mi rifugio.

Signore, non si inorgoglisce il mio cuore e non si leva con superbia il mio sguardo; non vado in cerca di cose grandi, superiori alle mie forze.

R. Proteggimi, o Dio: in te mi rifugio.

Io sono tranquillo e sereno come bimbo svezzato in braccio a sua madre, come un bimbo svezzato è l'anima mia. Speri Israele nel Signore, ora e sempre.

R. Proteggimi, o Dio: in te mi rifugio.`,
  },
  {
    id: 'sal-138',
    type: 'salmo',
    ref: 'Sal 138',
    titolo: `È stupendo, Signore, il tuo agire con i figli dell'uomo`,
    incipit: `È stupendo, Signore, il tuo agire con i figli dell'uomo`,
    ritornello: `È stupendo, Signore, il tuo agire con i figli dell'uomo.`,
    testoCompleto: `R. È stupendo, Signore, il tuo agire con i figli dell'uomo.

! Signore, tu mi scruti e mi conosci, tu sai quando seggo e quando mi alzo. Penetri da lontano i miei pensieri, mi scruti quando cammino e quando riposo.

R. È stupendo, Signore, il tuo agire con i figli dell'uomo.

Alle spalle e di fronte mi circondi e poni su di me la tua mano. Stupenda per me la tua saggezza, troppo alta, e io non la comprendo.

R. È stupendo, Signore, il tuo agire con i figli dell'uomo.

Sei tu che hai creato le mie viscere e mi hai tessuto nel seno di mia madre. Ti lodo, perché mi hai fatto come un prodigio; sono stupende le tue opere, tu mi conosci fino in fondo.

R. È stupendo, Signore, il tuo agire con i figli dell'uomo.

Quanto profondi per me i tuoi pensieri, quanto grande il loro numero, o Dio; se li conto sono più della sabbia, se li credo finiti, con te sono ancora.

R. È stupendo, Signore, il tuo agire con i figli dell'uomo.

Scrutami, Dio, e conosci il mio cuore, provami e conosci i miei pensieri: vedi se percorro una via di menzogna e guidami sulla via della vita.

R. È stupendo, Signore, il tuo agire con i figli dell'uomo.`,
  },
  {
    id: 'sal-144',
    type: 'salmo',
    ref: 'Sal 144',
    titolo: `Ricco di grazia è il Signore, nostro Dio`,
    incipit: `Ricco di grazia è il Signore, nostro Dio`,
    ritornello: `Ricco di grazia è il Signore, nostro Dio.`,
    testoCompleto: `R. Ricco di grazia è il Signore, nostro Dio.

Paziente e misericordioso è il Signore, lento all'ira e ricco di grazia. Buono è il Signore verso tutti, la sua tenerezza si espande su tutte le creature.

R. Ricco di grazia è il Signore, nostro Dio.

Ti lodino, Signore, tutte le tue opere e ti benedicano i tuoi fedeli. Gli occhi di tutti sono rivolti a te in attesa e tu provvedi loro il cibo a suo tempo.

R. Ricco di grazia è il Signore, nostro Dio.

Giusto è il Signore in tutte le sue vie, santo in tutte le sue opere. Il Signore è vicino a quanti lo invocano, a quanti lo cercano con cuore sincero.

R. Ricco di grazia è il Signore, nostro Dio.`,
    popolare: true,
  },
  {
    id: 'sal-148',
    type: 'salmo',
    ref: 'Sal 148',
    titolo: `Lodiamo insieme il Signore: sia benedetto il suo nome`,
    incipit: `Lodiamo insieme il Signore: sia benedetto il suo nome`,
    ritornello: `Lodiamo insieme il Signore: sia benedetto il suo nome.`,
    testoCompleto: `R. Lodiamo insieme il Signore: sia benedetto il suo nome.

Lodate il Signore dai cieli, lodatelo nell'alto dei cieli. Lodatelo, voi tutti, suoi angeli, lodatelo, voi tutte, sue schiere.

R. Lodiamo insieme il Signore: sia benedetto il suo nome.

Lodatelo, sole e luna, lodatelo, voi tutte, fulgide stelle. Lodatelo, cieli dei cieli, voi acque al di sopra dei cieli.

R. Lodiamo insieme il Signore: sia benedetto il suo nome.

Lodate il Signore dalla terra, monti e voi tutte, colline, alberi da frutto e tutti voi, cedri, voi fiere e tutte le bestie, rettili e uccelli alati.

R. Lodiamo insieme il Signore: sia benedetto il suo nome.

I re della terra e i popoli tutti, i governanti e i giudici della terra, i giovani e le fanciulle, i vecchi insieme ai bambini lodino il nome del Signore: perché solo il suo nome è sublime.

R. Lodiamo insieme il Signore: sia benedetto il suo nome.

La sua gloria risplende sulla terra e nei cieli. Egli ha sollevato la potenza del suo popolo. È canto di lode per tutti i suoi fedeli, per i figli di Israele, popolo che egli ama.

R. Lodiamo insieme il Signore: sia benedetto il suo nome.`,
  },
];

export const LETTURE_NT: ReadingOption[] = [
  {
    id: 'nt-romani-5-1-11',
    type: 'nt',
    ref: 'Rm 5, 1-11',
    titolo: "L'amore di Dio è stato riversato nei nostri cuori",
    incipit: `Fratelli, giustificati per la fede, noi siamo in pace con Dio per mezzo del Signore nostro Gesù Cristo; per suo mezzo abbiamo anche ottenuto, mediante...`,
    testoCompleto: `Fratelli, giustificati per la fede, noi siamo in pace con Dio per mezzo del Signore nostro Gesù Cristo; per suo mezzo abbiamo anche ottenuto, mediante la fede, di accedere a questa grazia nella quale ci troviamo e ci vantiamo nella speranza della gloria di Dio. E non soltanto questo: noi ci vantiamo anche nelle tribolazioni, ben sapendo che la tribolazione produce pazienza, la pazienza una virtù provata e la virtù provata la speranza. La speranza poi non delude, perché l'amore di Dio è stato riversato nei nostri cuori per mezzo dello Spirito Santo che ci è stato dato.`,
    salmoCorrispondente: 130,
  },
  {
    id: 'nt-romani-12-1-2-9-13',
    type: 'nt',
    ref: 'Rm 12, 1-2.9-13',
    titolo: "La carità non abbia finzioni",
    incipit: `Vi esorto, fratelli, per la misericordia di Dio, ad offrire i vostri corpi come sacrificio vivente, santo e gradito a Dio; è questo il vostro culto sp...`,
    testoCompleto: `Vi esorto, fratelli, per la misericordia di Dio, ad offrire i vostri corpi come sacrificio vivente, santo e gradito a Dio; è questo il vostro culto spirituale. Non conformatevi alla mentalità di questo secolo, ma trasformatevi rinnovando la vostra mente, per poter discernere la volontà di Dio, ciò che è buono, a lui gradito e perfetto. La carità non abbia finzioni: fuggite il male con orrore, attaccatevi al bene; amatevi gli uni gli altri con affetto fraterno, gareggiate nello stimarvi a vicenda. Non siate pigri nello zelo; siate invece ferventi nello spirito, servite il Signore, Siate lieti nella speranza, forti nella tribolazione, perseveranti nella preghiera, solleciti per le necessità dei fratelli, premurosi nell'ospitalità.`,
    salmoCorrispondente: 39,
  },
  {
    id: 'nt-romani-15-1b-3a-5-7-13',
    type: 'nt',
    ref: 'Rm 15, 1b-3a.5-7.13',
    titolo: "Accoglietevi gli uni gli altri come Cristo ha accolto voi",
    incipit: `Fratelli, [non dobbiamo] compiacere noi stessi. Ciascuno di noi cerchi di compiacere il prossimo nel bene, per edificarlo. Cristo infatti non cercò di...`,
    testoCompleto: `Fratelli, [non dobbiamo] compiacere noi stessi. Ciascuno di noi cerchi di compiacere il prossimo nel bene, per edificarlo. Cristo infatti non cercò di piacere a se stesso. E il Dio della perseveranza e della consolazione vi conceda di avere gli uni verso gli altri gli stessi sentimenti ad esempio di Cristo Gesù, perché con un solo animo e una voce sola rendiate gloria a Dio, Padre del Signore nostro Gesù Cristo. Accoglietevi perciò gli uni gli altri come Cristo accolse voi, per la gloria di Dio. Il Dio della speranza vi riempia di ogni gioia e pace nella fede, perché abbondiate nella speranza per la virtù dello Spirito Santo.`,
    salmoCorrispondente: 111,
  },
  {
    id: 'nt-corinzi-12-31-13-8a',
    type: 'nt',
    ref: 'Cor 12, 31-13, 8a',
    titolo: "Se non ho la carità niente mi giova",
    incipit: `Fratelli, aspirate ai carismi più grandi! E io vi mostrerò una via migliore di tutte. Se anche parlassi le lingue degli uomini e degli angeli, ma non...`,
    testoCompleto: `Fratelli, aspirate ai carismi più grandi! E io vi mostrerò una via migliore di tutte. Se anche parlassi le lingue degli uomini e degli angeli, ma non avessi la carità, sono come un bronzo che risuona o un cembalo che tintinna. E se avessi il dono della profezia e conoscessi tutti i misteri e tutta la scienza, e possedessi la pienezza della fede così da trasportare le montagne, ma non avessi la carità, non sono nulla. E se anche distribuissi tutte le mie sostanze e dessi il mio corpo per esser bruciato, ma non avessi la carità, niente mi giova. La carità è paziente, è benigna la carità; non è invidiosa la carità, non si vanta, non si gonfia, non manca di rispetto, non cerca il suo interesse, non si adira, non tiene conto del male ricevuto, non gode dell'ingiustizia, ma si compiace della verità. Tutto copre, tutto crede, tutto spera, tutto sopporta. La carità non avrà mai fine.`,
    popolare: true,
    salmoCorrispondente: 102,
  },
  {
    id: 'nt-efesini-1-3-6',
    type: 'nt',
    ref: 'Ef 1, 3-6',
    titolo: "Il Padre nella sua bontà ci ha voluto figli in Cristo Gesù",
    incipit: `Benedetto sia Dio, Padre del Signore nostro Gesù Cristo, che ci ha benedetti con ogni benedizione spirituale nei cieli, in Cristo. In lui ci ha scelti...`,
    testoCompleto: `Benedetto sia Dio, Padre del Signore nostro Gesù Cristo, che ci ha benedetti con ogni benedizione spirituale nei cieli, in Cristo. In lui ci ha scelti prima della creazione del mondo, per essere santi e immacolati al suo cospetto nella carità, predestinandoci a essere suoi figli adottivi per opera di Gesù Cristo, secondo il beneplacito della sua volontà. E questo a lode e gloria della sua grazia, che ci ha dato nel suo Figlio diletto.`,
    salmoCorrispondente: 102,
  },
  {
    id: 'nt-efesini-1-15-20a',
    type: 'nt',
    ref: 'Ef 1, 15-20a',
    titolo: "La chiamata all'amore per una più profonda conoscenza del Padre",
    incipit: `Fratelli, avendo avuto notizia della vostra fede nel Signore Gesù e dell'amore che avete verso tutti i santi, non cesso di rendere grazie per voi, ric...`,
    testoCompleto: `Fratelli, avendo avuto notizia della vostra fede nel Signore Gesù e dell'amore che avete verso tutti i santi, non cesso di rendere grazie per voi, ricordandovi nelle mie preghiere, perché il Dio del Signore nostro Gesù Cristo, il Padre della gloria, vi dia uno spirito di sapienza e di rivelazione per una più profonda conoscenza di lui. Possa egli davvero illuminare gli occhi della vostra mente per farvi comprendere a quale speranza vi ha chiamati, quale tesoro di gloria racchiude la sua eredità fra i santi e qual è la straordinaria grandezza della sua potenza verso di noi credenti secondo l'efficacia della sua forza che egli manifestò in Cristo.`,
    salmoCorrispondente: 60,
  },
  {
    id: 'nt-efesini-3-14-21',
    type: 'nt',
    ref: 'Ef 3, 14-21',
    titolo: "Dal Padre celeste deriva ogni paternità nelle creature",
    incipit: `Fratelli, io piego le ginocchia davanti al Padre, dal quale ogni paternità nei cieli e sulla terra prende nome, perché vi conceda, secondo la ricchezz...`,
    testoCompleto: `Fratelli, io piego le ginocchia davanti al Padre, dal quale ogni paternità nei cieli e sulla terra prende nome, perché vi conceda, secondo la ricchezza della sua gloria, di essere potentemente rafforzati dal suo Spirito nell'uomo inferiore. Che il Cristo abiti per la fede nei vostri cuori e così, radicati e fondati nella carità, siate in grado di comprendere con tutti i santi quale sia l'ampiezza, la lunghezza, l'altezza e la profondità, e conoscere l'amore di Cristo che sorpassa ogni conoscenza, perché siate ricolmi di tutta la pienezza di Dio. A colui che in tutto ha potere di fare molto più di quanto possiamo domandare o pensare, secondo la potenza che già opera in noi, a lui la gloria nella Chiesa e in Cristo Gesù per tutte le generazioni, nei secoli dei secoli! Amen.`,
    salmoCorrispondente: 99,
  },
  {
    id: 'nt-efesini-4-1-6',
    type: 'nt',
    ref: 'Ef 4, 1-6',
    titolo: "Un solo Signore",
    incipit: `.. un solo Dio Padre di tutti. Vi esorto, fratelli, io, il prigioniero nel Signore, a comportarvi in maniera degna della vocazione che avete ricevuto...`,
    testoCompleto: `.. un solo Dio Padre di tutti. Vi esorto, fratelli, io, il prigioniero nel Signore, a comportarvi in maniera degna della vocazione che avete ricevuto, con ogni umiltà, mansuetudine e pazienza, sopportandovi a vicenda con amore, cercando di conservare Punita dello spirito per mezzo del vincolo della pace. Un solo corpo, un solo spirito, come una sola è la speranza alla quale siete stati chiamati, quella della vostra vocazione; un solo Signore, una sola fede, un solo battesimo. Un solo Dio Padre di tutti, che è al di sopra di tutti, agisce per mezzo di tutti ed è presente in tutti.`,
    salmoCorrispondente: 102,
  },
  {
    id: 'nt-efesini-5-2a-25-32',
    type: 'nt',
    ref: 'Ef 5, 2a.25-32',
    titolo: "Questo mistero è grande; lo dico in riferimento a Cristo e alla Chiesa! Fratelli, camminate nella carità, nel modo che anche Cristo vi ha amato e ha dato se stesso per noi",
    incipit: `Voi, mariti, amate le vostre mogli, come Cristo ha amato la Chiesa e ha dato se stesso per lei, per renderla santa, purificandola per mezzo del lavacr...`,
    testoCompleto: `Voi, mariti, amate le vostre mogli, come Cristo ha amato la Chiesa e ha dato se stesso per lei, per renderla santa, purificandola per mezzo del lavacro dell'acqua accompagnato dalla parola, al fine di farsi comparire davanti la sua Chiesa tutta gloriosa, senza macchia né ruga o alcunché di simile, ma santa e immacolata. Così anche i mariti hanno il dovere di amare le mogli come il proprio corpo, perché chi ama la propria moglie ama se stesso. Nessuno mai infatti ha preso in odio la propria carne; al contrario la nutre e la cura, come fa Cristo con la Chiesa, poiché siamo membra del suo corpo. Per questo l'uomo lascerà suo padre e sua madre e si unirà alla sua donna e i due formeranno una carne sola. Questo mistero è grande; lo dico in riferimento a Cristo e alla Chiesa!`,
    popolare: true,
    salmoCorrispondente: 127,
  },
  {
    id: 'nt-filippesi-4-4-9',
    type: 'nt',
    ref: 'Fil 4, 4-9',
    titolo: "Il Dio della pace sia con voi",
    incipit: `Fratelli, rallegratevi nel Signore, sempre; ve lo ripeto ancora, rallegratevi. La vostra affabilità sia nota a tutti gli uomini. Il Signore è vicino!...`,
    testoCompleto: `Fratelli, rallegratevi nel Signore, sempre; ve lo ripeto ancora, rallegratevi. La vostra affabilità sia nota a tutti gli uomini. Il Signore è vicino! Non angustiatevi per nulla, ma in ogni necessità esponete a Dio le vostre richieste, con preghiere, suppliche e ringraziamenti; e la pace di Dio, che sorpassa ogni intelligenza, custodirà i vostri cuori e i vostri pensieri in Cristo Gesù. In conclusione, fratelli, tutto quello che è vero, nobile, giusto, puro, amabile, onorato, quello che è virtù e merita lode, tutto questo sia oggetto dei vostri pensieri. Ciò che avete imparato, ricevuto, ascoltato e veduto in me, è quello che dovete fare. E il Dio della pace sarà con voi!`,
    salmoCorrispondente: 32,
  },
  {
    id: 'nt-colossesi-3-12-17',
    type: 'nt',
    ref: 'Col 3, 12-17',
    titolo: "Al di sopra di tutto vi sia la carità, che è il vincolo della perfezione",
    incipit: `Fratelli, rivestitevi, come eletti di Dio, santi e amati, di sentimenti di misericordia, di bontà, di umiltà, di mansuetudine, di pazienza; sopportand...`,
    testoCompleto: `Fratelli, rivestitevi, come eletti di Dio, santi e amati, di sentimenti di misericordia, di bontà, di umiltà, di mansuetudine, di pazienza; sopportandovi a vicenda e perdonandovi scambievolmente, se qualcuno abbia di che lamentarsi nei riguardi degli altri. Come il Signore vi ha perdonato, così fate anche voi. Al di sopra di tutto poi vi sia la carità, che è il vincolo della perfezione. E la pace di Cristo regni nei vostri cuori, perché ad essa siete stati chiamati in un solo corpo» E siate riconoscenti! La parola di Cristo dimori tra voi abbondantemente; ammaestratevi e ammonitevi con ogni sapienza, cantando a Dio di cuore e con gratitudine salmi, inni e cantici spirituali. E tutto quello che fate in parole ed opere, tutto si compia nel nome del Signore Gesù, rendendo per mezzo di lui grazie a Dio Padre.`,
    salmoCorrispondente: 33,
  },
  {
    id: 'nt-tessalonicesi-5-13b-28',
    type: 'nt',
    ref: 'Ts 5, 13b-28',
    titolo: "Non spegnete lo Spirito e non disprezzate le profezie",
    incipit: `Fratelli, vivete in pace tra voi. Vi esortiamo, fratelli: correggete gli indisciplinati, confortate i pusillanimi, sostenete i deboli, siate pazienti...`,
    testoCompleto: `Fratelli, vivete in pace tra voi. Vi esortiamo, fratelli: correggete gli indisciplinati, confortate i pusillanimi, sostenete i deboli, siate pazienti con tutti. Guardatevi dal rendere male per male ad alcuno; ma cercate sempre il bene tra voi e con tutti. State sempre lieti, pregate incessantemente, in ogni cosa rendete grazie; questa è infatti la volontà di Dio in Cristo Gesù verso di voi. Non spegnete lo Spirito, non disprezzate le profezie; esaminate ogni cosa, tenete ciò che è buono. Astenetevi da ogni specie di male. Il Dio della pace vi santifichi fino alla perfezione, e tutto quello che è vostro, spirito, anima e corpo, si conservi per la venuta del Signore nostro Gesù Cristo. Colui che vi chiama è fedele e farà tutto questo! Fratelli, pregate anche per noi. Salutate tutti i fratelli con il bacio santo. Vi scongiuro, per il Signore, che si legga questa lettera a tutti i fratelli. La grazia del Signore nostro Gesù Cristo sia con voi.`,
    salmoCorrispondente: 45,
  },
];

export const VANGELI: ReadingOption[] = [
  {
    id: 'vg-matteo-5-1-16',
    type: 'vangelo',
    ref: 'Mt 5, 1-16',
    titolo: "Risplenda la vostra luce su tutti quelli che entrano nella vostra casa",
    incipit: `In quel tempo, vedendo le folle, Gesù salì sulla montagna e,messosi a sedere, gli si avvicinarono i suoi discepoli. Prendendo allora la parola, li amm...`,
    testoCompleto: `In quel tempo, vedendo le folle, Gesù salì sulla montagna e,messosi a sedere, gli si avvicinarono i suoi discepoli. Prendendo allora la parola, li ammaestrava dicendo: «Beati i poveri in spirito, perché di essi è il regno dei cieli. Beati gli afflitti, perché saranno consolati. Beati i miti, perché erediteranno la terra. Beati quelli che hanno fame e sete della giustizia, perché saranno saziati. Beati i misericordiosi, perché troveranno misericordia. Beati i puri di cuore, perché vedranno Dio. Beati gli operatori di pace, perché saranno chiamati figli di Dio. Beati i perseguitati per causa della giustizia, perché di essi è il regno dei cieli. Beati voi quando vi insulteranno, vi perseguiteranno e, mentendo, diranno ogni sorta di male contro di voi per causa mia. Rallegratevi ed esultate, perché grande è la vostra ricompensa nei cieli. Così infatti hanno perseguitato i profeti prima di voi. Voi siete il sale della terra; ma se il sale perdesse il sapore, con che cosa lo si potrà rendere salato? A null'altro serve che ad essere gettato via e calpestato dagli uomini. Voi siete la luce del mondo; non può restare nascosta una città collocata sopra un monte, né si accende una lucerna per metterla sotto il moggio, ma sopra il lucerniere perché faccia luce a tutti quelli che sono nella casa. Così risplenda la vostra luce davanti agli uomini, perché vedano le vostre opere buone e rendano gloria al vostro Padre che è nei cieli».`,
  },
  {
    id: 'vg-matteo-5-13-16',
    type: 'vangelo',
    ref: 'Mt 5, 13-16',
    titolo: "Voi siete la luce del mondo",
    incipit: `In quel tempo, Gesù disse ai suoi discepoli: «Voi siete il sale della terra; ma se il sale perdesse il sapore,con che cosa lo si potrà rendere salato?...`,
    testoCompleto: `In quel tempo, Gesù disse ai suoi discepoli: «Voi siete il sale della terra; ma se il sale perdesse il sapore,con che cosa lo si potrà rendere salato? A null'altro serve che ad essere gettato via e calpestato dagli uomini. Voi siete la luce del mondo; non può restare nascosta una città collocata sopra un monte, né si accende una lucerna per metterla sotto il moggio, ma sopra il lucerniere perché faccia luce a tutti quelli che sono nella casa. Così risplenda la vostra luce davanti agli uomini, perché vedano le vostre opere buone e rendano gloria al vostro Padre che è nei cieli».`,
    popolare: true,
  },
  {
    id: 'vg-matteo-6-25-34',
    type: 'vangelo',
    ref: 'Mt 6, 25-34',
    titolo: "Non affannatevi per il domani",
    incipit: `In quel tempo, Gesù disse ai suoi discepoli: «Io vi dico: per la vostra vita non affannatevi di quello che mangerete o berrete, e neanche per il vostr...`,
    testoCompleto: `In quel tempo, Gesù disse ai suoi discepoli: «Io vi dico: per la vostra vita non affannatevi di quello che mangerete o berrete, e neanche per il vostro corpo, di quello che indosserete; la vita forse non vale più del cibo e il corpo più del vestito? Guardate gli uccelli del cielo: non seminano, né mietono,né ammassano nei granai; eppure il Padre vostro celeste li nutre. Non contate voi forse più di loro? E chi di voi, per quanto si dia da fare, può aggiungere un'ora sola alla sua.vita? E perché vi affannate per il vestito? Osservate come crescono i gigli del campo: non lavorano e non filano. Eppure io vi dico che neanche Salomone, con tutta la sua gloria, vestiva come uno di loro. Ora se Dio veste così l'erba del campo, che oggi c'è e domani verrà gettata nel forno, non farà assai più per voi,gente di poca fede? Non affannatevi dunque dicendo: "Che cosa mangeremo? Che cosa berremo? Che cosa indosseremo?". Di tutte queste cose si preoccupano i pagani; il Padre vostro celeste infatti sa che ne avete bisogno. Cercate prima il regno di Dio e la sua giustizia, e tutte queste cose vi saranno date in aggiunta. Non affannatevi dunque per il domani, perché il domani avrà già le sue inquietudini. A ciascun giorno basta la sua pena».`,
  },
  {
    id: 'vg-matteo-7-21-24-25',
    type: 'vangelo',
    ref: 'Mt 7, 21.24-25',
    titolo: "Costruì la sua casa sulla roccia",
    incipit: `In quel tempo, Gesù disse ai suoi discepoli: «Non chiunque mi dice: "Signore, Signore", entrerà nel regno dei cieli, ma colui che fa la volontà del Pa...`,
    testoCompleto: `In quel tempo, Gesù disse ai suoi discepoli: «Non chiunque mi dice: "Signore, Signore", entrerà nel regno dei cieli, ma colui che fa la volontà del Padre mio che è nei cieli. Perciò chiunque ascolta queste mie parole e le mette in pratica, è simile a un uomo saggio che ha costruito la sua casa sulla roccia. Cadde la pioggia, strariparono i fiumi, soffiarono i venti e si abbatterono su quella casa, ed essa non cadde, perché era fondata sopra la roccia».`,
    popolare: true,
  },
  {
    id: 'vg-matteo-18-19-22',
    type: 'vangelo',
    ref: 'Mt 18, 19-22',
    titolo: "Io sono in mezzo a voi",
    incipit: `In quel tempo, Gesù disse ai suoi discepoli: «In verità vi dico: se due di voi sopra la terra si accorderanno per domandare qualunque cosa, il Padre m...`,
    testoCompleto: `In quel tempo, Gesù disse ai suoi discepoli: «In verità vi dico: se due di voi sopra la terra si accorderanno per domandare qualunque cosa, il Padre mio che è nei cieli ve la concederà. Perché dove sono due o tre riuniti nel mio nome, io sono in mezzo a loro». Allora Pietro gli si avvicinò e gli disse: «Signore, quante volte dovrò perdonare al mio fratello, se pecca contro di me? Fino a sette volte?». E Gesù gli rispose: «Non ti dico fino a sette, ma fino a settanta volte sette».`,
  },
  {
    id: 'vg-matteo-19-3-6',
    type: 'vangelo',
    ref: 'Mt 19, 3-6',
    titolo: "Quello che Dio ha congiunto, l'uomo non separi",
    incipit: `In quel tempo, si avvicinarono a Gesù alcuni farisei per metterlo alla prova e gli chiesero: «E lecito ad un uomo ripudiare la propria moglie per qual...`,
    testoCompleto: `In quel tempo, si avvicinarono a Gesù alcuni farisei per metterlo alla prova e gli chiesero: «E lecito ad un uomo ripudiare la propria moglie per qualsiasi motivo?». Ed egli rispose: «Non avete letto che il Creatore da principio li creò maschio e femmina e disse: "Per questo l'uomo lascerà suo padre e sua madre e si unirà a sua moglie e i due saranno una carne sola"? Così che non sono più due, ma una carne sola. Quello dunque che Dio ha congiunto, l'uomo non lo separi».`,
    popolare: true,
  },
  {
    id: 'vg-matteo-22-35-40',
    type: 'vangelo',
    ref: 'Mt 22, 35-40',
    titolo: "Questo è il primo dei comandamenti",
    incipit: `E il secondo è simile al primo. In quel tempo, un dottore della legge interrogò Gesù per metterlo alla prova: «Maestro, qual è il più grande comandame...`,
    testoCompleto: `E il secondo è simile al primo. In quel tempo, un dottore della legge interrogò Gesù per metterlo alla prova: «Maestro, qual è il più grande comandamento della legge?». Gli rispose: «Amerai il Signore Dio tuo con tutto il cuore, con tutta la tua anima e con tutta la tua mente. Questo è il più grande e il primo dei comandamenti. E il secondo è simile al primo: Amerai il prossimo tuo come te stesso. Da questi due comandamenti dipendono tutta la Legge e i Profeti».`,
    popolare: true,
  },
  {
    id: 'vg-matteo-28-16-20',
    type: 'vangelo',
    ref: 'Mt 28, 16-20',
    titolo: "Andate e insegnate a osservare tutto ciò che vi ho comandato",
    incipit: `In quel tempo, gli undici discepoli andarono in Galilea, sul monte che Gesù aveva loro fissato. Quando lo videro, gli si prostrarono innanzi; alcuni p...`,
    testoCompleto: `In quel tempo, gli undici discepoli andarono in Galilea, sul monte che Gesù aveva loro fissato. Quando lo videro, gli si prostrarono innanzi; alcuni però dubitavano. E Gesù, avvicinatosi, disse loro: «Mi è stato dato ogni potere in cielo e in terra. Andate dunque e ammaestrate tutte le nazioni, battezzandole nel nome del Padre e del Figlio e dello Spirito santo, insegnando loro ad osservare tutto ciò che vi ho comandato. Ecco, io sono con voi tutti i giorni, fino alla fine del mondo».`,
  },
  {
    id: 'vg-marco-10-6-9',
    type: 'vangelo',
    ref: 'Mc 10, 6-9',
    titolo: "Non sono più due, ma una carne sola",
    incipit: `In quel tempo Gesù disse: «All'inizio della creazione Dio li creò maschio e femmina; per questo l'uomo lascerà suo padre e sua madre e i due saranno u...`,
    testoCompleto: `In quel tempo Gesù disse: «All'inizio della creazione Dio li creò maschio e femmina; per questo l'uomo lascerà suo padre e sua madre e i due saranno una carne sola. Sicché non sono più due, ma una sola carne. L'uomo dunque non separi ciò che Dio ha congiunto».`,
  },
  {
    id: 'vg-marco-16-15-20',
    type: 'vangelo',
    ref: 'Mc 16, 15-20',
    titolo: "Il Signore operava insieme con loro e confermava la parola con i prodigi che l'accompagnavano",
    incipit: `In quel tempo, Gesù disse ai suoi discepoli: «Andate in tutto il mondo e predicate il vangelo ad ogni creatura. Chi crederà e sarà battezzato sarà sal...`,
    testoCompleto: `In quel tempo, Gesù disse ai suoi discepoli: «Andate in tutto il mondo e predicate il vangelo ad ogni creatura. Chi crederà e sarà battezzato sarà salvo, ma chi non crederà sarà condannato. E questi saranno i segni che accompagneranno quelli che credono: nel mio nome scacceranno i demòni, parleranno lingue nuove, prenderanno in mano i serpenti e, se berranno qualche veleno, non recherà loro danno, imporranno le mani ai malati e questi guariranno». Il Signore Gesù, dopo aver parlato con loro, fu assunto in cielo e sedette alla destra di Dio. Allora essi partirono e predicarono dappertutto, mentre il Signore operava insieme con loro e confermava la parola con i prodigi che l'accompagnavano.`,
  },
  {
    id: 'vg-luca-1-39-56',
    type: 'vangelo',
    ref: 'Lc 1, 39-56',
    titolo: "Beata colei che ha creduto nell'adempimento delle parole del Signore",
    incipit: `In quei giorni Maria si mise in viaggio verso la montagna e raggiunse in fretta una città di Giuda. Entrata nella casa di Zaccaria, salutò Elisabetta....`,
    testoCompleto: `In quei giorni Maria si mise in viaggio verso la montagna e raggiunse in fretta una città di Giuda. Entrata nella casa di Zaccaria, salutò Elisabetta. Appena Elisabetta ebbe udito il saluto di Maria, il bambino le sussultò nel grembo. Elisabetta fu piena di Spirito Santo ed esclamò a gran voce: «Benedetta tu fra le donne e benedetto il frutto del tuo grembo! A che debbo che la madre del mio Signore venga a me? Ecco, appena la voce del tuo saluto è giunta ai miei orecchi, il bambino ha esultato di gioia nel mio grembo» E beata colei che ha creduto nell'adempimento delle parole del Signore». Allora Maria disse: «L'anima mia magnifica il Signore e il mio spirito esulta in Dio, mio salvatore, perché ha guardato l'umiltà della sua serva. D'ora in poi tutte le generazioni mi chiameranno beata. Grandi cose ha fatto in me l'Onnipotente e Santo è il suo nome: di generazione in generazione la sua misericordia si stende su quelli che lo temono. Ha spiegato la potenza del suo braccio, ha disperso i superbi nei pensieri del loro cuore; ha rovesciato i potenti dai troni, ha innalzato gli umili; ha ricolmato di beni gli affamati, ha rimandato i ricchi a mani vuote. Ha soccorso Israele, suo servo, ricordandosi della sua misericordia, come aveva promesso ai nostri padri, ad Abramo e alla sua discendenza, per sempre». Maria rimase con lei circa tre mesi, poi tornò a casa sua.`,
  },
  {
    id: 'vg-luca-6-27-36',
    type: 'vangelo',
    ref: 'Lc 6, 27-36',
    titolo: "Siate misericordiosi come il Padre vostro celeste",
    incipit: `In quel tempo, Gesù disse ai suoi discepoli: «A voi che ascoltate, io dico: Amate i vostri nemici, fate del bene a coloro che vi odiano, benedite colo...`,
    testoCompleto: `In quel tempo, Gesù disse ai suoi discepoli: «A voi che ascoltate, io dico: Amate i vostri nemici, fate del bene a coloro che vi odiano, benedite coloro che vi maledicono, pregate per coloro che vi maltrattano. A chi ti percuote sulla guancia, porgi anche l'altra; a chi ti leva il mantello, non rifiutare la tunica. Dà a chiunque ti chiede; e a chi prende del tuo, non richiederlo. Ciò che volete gli uomini facciano a voi, anche voi fatelo a loro. Se amate quelli che vi amano, che merito ne avrete? Anche i peccatori fanno lo stesso. E se fate del bene a coloro che vi fanno del bene, che merito ne avrete? Anche i peccatori fanno lo stesso. E se prestate a coloro da cui sperate ricevere, che merito ne avrete? Anche i peccatori concedono prestiti ai peccatori per riceverne altrettanto. Amate invece i vostri nemici, fate del bene e prestate senza sperarne nulla, e il vostro premio sarà grande e sarete figli dell'Altissimo; perché egli è benevolo verso gli ingrati e i malvagi. Siate misericordiosi, come è misericordioso il Padre vostro».`,
  },
  {
    id: 'vg-luca-11-9-13',
    type: 'vangelo',
    ref: 'Lc 11, 9-13',
    titolo: "Se voi date cose buone ai vostri figli, quanto più Dio che è Padre",
    incipit: `In quel tempo, Gesù disse ai suoi discepoli: «Chiedete e vi sarà dato, cercate e troverete, bussate e vi sarà aperto Perché chi chiede ottiene, chi ce...`,
    testoCompleto: `In quel tempo, Gesù disse ai suoi discepoli: «Chiedete e vi sarà dato, cercate e troverete, bussate e vi sarà aperto Perché chi chiede ottiene, chi cerca trova, e a chi bussa sarà aperto. Quale padre tra voi, se il figlio gli chiede un pane, gli darà una pietra? O se gli chiede un pesce, gli darà al posto del pesce una serpe? O se gli chiede un uovo, gli darà uno scorpione? Se dunque voi, che siete cattivi, sapete dare cose buone ai vostri figli, quanto più il Padre vostro celeste darà lo Spirito Santo a coloro che glielo chiedono!».`,
  },
  {
    id: 'vg-luca-14-12-23',
    type: 'vangelo',
    ref: 'Lc 14, 12-23',
    titolo: "Beato chi mangerà il pane nel regno di Dio",
    incipit: `In quel tempo, Gesù disse a colui che l'aveva invitato: «Quando offri un pranzo o una cena, non invitare i tuoi amici, né i tuoi fratelli, né i tuoi p...`,
    testoCompleto: `In quel tempo, Gesù disse a colui che l'aveva invitato: «Quando offri un pranzo o una cena, non invitare i tuoi amici, né i tuoi fratelli, né i tuoi parenti, né i ricchi vicini, perché anch'essi non ti invitino a loro volta e tu abbia il contraccambio. Al contrario, quando dai un banchetto, invita poveri, storpi, zoppi, ciechi; e sarai beato perché non hanno da ricambiarti. Riceverai infatti la tua ricompensa alla risurrezione dei giusti». Uno dei commensali, avendo udito ciò, gli disse: «Beato chi mangerà il pane nel regno di Dio!». Gesù rispose: «Un uomo diede una grande cena e fece molti inviti. All'ora della cena, mandò il suo servo a dire agli invitati: "Venite, è pronto". Ma tutti, all'unanimità, cominciarono a scusarsi. Il primo disse: "Ho comprato un campo e devo andare a vederlo; ti prego, considerami giustificato". Un altro disse: "Ho comprato cinque paia di buoi e vado a provarli; ti prego, considerami giustificato". Un altro disse: "Ho preso moglie e perciò non posso venire". Al suo ritorno il servo riferì tutto questo al padrone. Allora il padrone di casa, irritato, disse al servo: "Esci subito per le piazze e per le vie della città e conduci qui poveri, storpi, ciechi e zoppi". Il servo disse: "Signore, è stato fatto come hai ordinato, ma c'è ancora posto". Il padrone allora disse al servo: "Esci per le strade e lungo le siepi, spingili a entrare, perché la mia casa si riempia"».`,
  },
  {
    id: 'vg-luca-20-27-38',
    type: 'vangelo',
    ref: 'Lc 20, 27-38',
    titolo: "I figli della risurrezione sono figli di Dio",
    incipit: `In quel tempo, si avvicinarono a Gesù alcuni sadducei, i quali negano che vi sia la risurrezione, e gli posero questa domanda: «Maestro, Mosè ci ha pr...`,
    testoCompleto: `In quel tempo, si avvicinarono a Gesù alcuni sadducei, i quali negano che vi sia la risurrezione, e gli posero questa domanda: «Maestro, Mosè ci ha prescritto: "Se a qualcuno muore un fratello che ha moglie, ma senza figli, suo fratello si prenda la vedova e dia una discendenza al proprio fratello" C'erano dunque sette fratelli: il primo, dopo aver preso moglie, morì senza figli. Allora la prese il secondo e poi il terzo e così tutti e sette; e morirono tutti senza lasciare figli. Da ultimo anche la donna morì. Questa donna dunque, nella risurrezione, di chi sarà moglie? Poiché tutti e sette l'hanno avuta in moglie». Gesù rispose: «I figli di questo mondo prendono moglie e prendono marito; ma quelli che sono giudicati degni dell'altro mondo e della risurrezione dai morti, non prendono moglie né marito; e nemmeno possono più morire, perché sono uguali agli angeli e, essendo figli della risurrezione, sono figli di Dio. Che poi i morti risorgono, lo ha indicato anche Mosè a proposito del roveto, quando chiama il Signore: "Dio di Abramo, Dio di Isacco e Dio di Giacobbe". Dio non è Dio dei morti, ma dei vivi; perché tutti vivono per lui».`,
  },
  {
    id: 'vg-giovanni-2-1-11',
    type: 'vangelo',
    ref: 'Gv 2, 1-11',
    titolo: "Questo fu a Caria di Gallica l'inizio dei segni compiuti da Gesù",
    incipit: `In quel tempo, ci fu uno sposalizio a Cana di Galilea e c'era la madre di Gesù. Fu invitato alle nozze anche Gesù con i suoi discepoli. Nel frattempo...`,
    testoCompleto: `In quel tempo, ci fu uno sposalizio a Cana di Galilea e c'era la madre di Gesù. Fu invitato alle nozze anche Gesù con i suoi discepoli. Nel frattempo, venuto a mancare il vino, la madre di Gesù gli disse: «Non hanno più vino». E Gesù rispose: «Che ho da fare con te, o donna? Non è ancora giunta la mia ora». La madre dice ai servi: «Fate quello che vi dirà». Vi erano là sei giare di pietra per la purificazione dei Giudei, contenenti ciascuna due o tre barili. E Gesù disse loro: «Riempite d'acqua le giare»; e le riempirono fino all'orlo. Disse loro di nuovo: «Ora attingete e portatene al maestro di tavola». Ed essi gliene portarono. E come ebbe assaggiato l'acqua diventata vino, il maestro di tavola, che non sapeva di dove venisse (ma lo sapevano i servi che avevano attinto l'acqua), chiamò lo sposo e gli disse: «Tutti servono da principio il vino buono e, quando sono un po' brilli, quello meno buono; tu invece hai conservato fino ad ora il vino buono». Così Gesù diede inizio ai suoi miracoli in Cana di Galilea, manifestò la sua gloria e i suoi discepoli credettero in lui.`,
    popolare: true,
  },
  {
    id: 'vg-giovanni-3-28-36a',
    type: 'vangelo',
    ref: 'Gv 3, 28-36a',
    titolo: "Giovanni il Battista esulta di gioia alla voce di Cristo sposo",
    incipit: `In quel tempo, Giovanni disse: «Voi stessi mi siete testimoni che ho detto: Non sono io il Cristo, ma io sono stato mandato innanzi a lui. Chi possied...`,
    testoCompleto: `In quel tempo, Giovanni disse: «Voi stessi mi siete testimoni che ho detto: Non sono io il Cristo, ma io sono stato mandato innanzi a lui. Chi possiede la sposa è lo sposo; ma l'amico dello sposo, che è presente e l'ascolta, esulta di gioia alla voce dello sposo. Ora questa mia gioia è compiuta. Egli deve crescere e io invece diminuire». Colui che viene dall'alto è al di sopra di tutti; ma chi viene dalla terra, appartiene alla terra e parla della terra. Chi viene dal cielo è al di sopra di tutti. Egli attesta ciò che ha visto e udito, eppure nessuno accetta la sua testimonianza; chi però ne accetta la testimonianza, certifica che Dio è veritiero. Infatti colui che Dio ha mandato proferisce le parole di Dio e da lo Spirito senza misura. Il Padre ama il Figlio e gli ha dato in mano ogni cosa. Chi crede nel Figlio ha la vita eterna.`,
  },
  {
    id: 'vg-giovanni-14-12-17',
    type: 'vangelo',
    ref: 'Gv 14, 12-17',
    titolo: "Chi crede in me compirà le opere che io compio",
    incipit: `In quel tempo, Gesù disse ai suoi discepoli: «In verità, in verità vi dico: anche chi crede in me, compirà le opere che io compio e ne farà di più gra...`,
    testoCompleto: `In quel tempo, Gesù disse ai suoi discepoli: «In verità, in verità vi dico: anche chi crede in me, compirà le opere che io compio e ne farà di più grandi, perché io vado al Padre. Qualunque cosa chiederete nel nome mio, la farò, perché il Padre sia glorificato nel Figlio. Se mi chiederete qualche cosa nel mio nome, io la farò. Se mi amate, osserverete i miei comandamenti. Io pregherò il Padre ed egli vi darà un altro Consolatore perché rimanga con voi per sempre, lo Spirito di verità che il mondo non può ricevere, perché non lo vede e non lo conosce. Voi lo conoscete, perché egli dimora presso di voi e sarà in voi».`,
  },
  {
    id: 'vg-giovanni-15-1-17',
    type: 'vangelo',
    ref: 'Gv 15, 1-17',
    titolo: "Io vi ho scelto e vi ho costituiti perché andiate e portiate frutto e il vostro frutto rimanga",
    incipit: `In quel tempo, Gesù disse ai suoi discepoli: «Io sono la vera vite e il Padre mio è il vignaiolo. Ogni tralcio che in me non porta frutto, lo toglie e...`,
    testoCompleto: `In quel tempo, Gesù disse ai suoi discepoli: «Io sono la vera vite e il Padre mio è il vignaiolo. Ogni tralcio che in me non porta frutto, lo toglie e ogni tralcio che porta frutto, lo pota perché porti più frutto. Voi siete già mondi, per la parola che vi ho annunziato. Rimanete in me e io in voi. Come il tralcio non può far frutto da se stesso se non rimane nella vite, così anche voi se non rimanete in me. Io sono la vite, voi i tralci. Chi rimane in me e io in lui, fa molto frutto, perché senza di me non potete far nulla. Chi non rimane in me viene gettato via come il tralcio e si secca, e poi lo raccolgono e lo gettano nel fuoco e lo bruciano. Se rimanete in me e le mie parole rimangono in voi, chiedete quel che volete e vi sarà dato. In questo è glorificato il Padre mio: che portiate molto frutto e diventiate miei discepoli. Come il Padre ha amato me, così anch'io ho amato voi» Rimanete nel mio amore. Se osserverete i miei comandamenti, rimarrete nel mio amore, come io ho osservato i comandamenti del Padre mio e rimango nel suo amore. Questo vi ho detto perché la mia gioia sia in voi e la vostra gioia sia piena. Questo è il mio comandamento: che vi amiate gli uni gli altri, come io vi ho amati. Nessuno ha un amore più grande di questo: dare la vita per i propri amici. Voi siete miei amici, se farete ciò che io vi comando. Non vi chiamo più servi, perché il servo non sa quello che fa il suo padrone; ma vi ho chiamati amici, perché tutto ciò che ho udito dal Padre l'ho fatto conoscere a voi. Non voi avete scelto me, ma io ho scelto voi e vi ho costituiti perché andiate e portiate frutto e il vostro frutto rimanga; perché tutto quello che chiederete al Padre nel mio nome, ve lo conceda. Questo vi comando: amatevi gli uni gli altri».`,
  },
  {
    id: 'vg-giovanni-15-9-12',
    type: 'vangelo',
    ref: 'Gv 15, 9-12',
    titolo: "Rimanete nel mio amore",
    incipit: `In quel tempo, Gesù disse ai suoi discepoli: «Come il Padre ha amato me, così anch'io ho amato voi Rimanete nel mio amore. Se osserverete i miei coman...`,
    testoCompleto: `In quel tempo, Gesù disse ai suoi discepoli: «Come il Padre ha amato me, così anch'io ho amato voi Rimanete nel mio amore. Se osserverete i miei comandamenti, rimarrete nel mio amore, come io ho osservato i comandamenti del Padre mio e rimango nel suo amore. Questo vi ho detto perché la mia gioia sia in voi e la vostra gioia sia piena. Questo è il mio comandamento: che vi amiate gli uni gli altri,come io vi ho amati».`,
    popolare: true,
  },
  {
    id: 'vg-giovanni-15-12-16',
    type: 'vangelo',
    ref: 'Gv 15, 12-16',
    titolo: "Questo è il mio comandamento: che vi amiate gli uni gli altri",
    incipit: `In quel tempo, Gesù disse ai suoi discepoli: «Questo è il mio comandamento: che vi amiate gli uni gli altri, come io vi ho amati. Nessuno ha un amore...`,
    testoCompleto: `In quel tempo, Gesù disse ai suoi discepoli: «Questo è il mio comandamento: che vi amiate gli uni gli altri, come io vi ho amati. Nessuno ha un amore più grande di questo: dare la vita per i propri amici. Voi siete miei amici, se farete ciò che io vi comando. Non vi chiamo più servi, perché il servo non sa quello che fa il suo padrone; ma vi ho chiamati amici, perché tutto ciò che ho udito dal Padre l'ho fatto conoscere a voi. Non voi avete scelto me, ma io ho scelto voi e vi ho costituiti perché andiate e portiate frutto e il vostro frutto rimanga; perché tutto quello che chiederete al Padre nel mio nome, ve lo conceda».`,
  },
  {
    id: 'vg-giovanni-17-20-23',
    type: 'vangelo',
    ref: 'Gv 17, 20-23',
    titolo: "Tutti siano una cosa sola",
    incipit: `In quel tempo, [Gesù, alzati gli occhi al cielo, pregava dicendo: «Padre santo,] non prego solo per questi, ma anche per quelli che per la loro parola...`,
    testoCompleto: `In quel tempo, [Gesù, alzati gli occhi al cielo, pregava dicendo: «Padre santo,] non prego solo per questi, ma anche per quelli che per la loro parola crederanno in me; perché tutti siano una sola cosa. Come tu, Padre, sei in me e io in te, siano anch'essi in noi una cosa sola, perché il mondo creda che tu mi hai mandato. E la gloria che tu hai dato a me, io l'ho data a loro, perché siano come noi una cosa sola. Io in loro e tu in me, perché siano perfetti nell'unità e il mondo sappia che tu mi hai mandato e li hai amati come hai amato me».`,
  },
];

export const TUTTE_LE_LETTURE: ReadingOption[] = [
  ...LETTURE_AT,
  ...LETTURE_TEMPO_PASQUALE,
  ...SALMI,
  ...LETTURE_NT,
  ...VANGELI,
];

export function findLettura(id: string): ReadingOption | undefined {
  return TUTTE_LE_LETTURE.find((r) => r.id === id);
}

/** Trova il salmo dal numero (es. 127 → ReadingOption del Salmo 127). */
export function findSalmoByNum(num: number): ReadingOption | undefined {
  return SALMI.find((s) => s.id === `sal-${num}`);
}

export interface CantoSuggerito {
  titolo: string;
  momento: 'ingresso' | 'gloria' | 'salmo' | 'alleluia' | 'offertorio' | 'santo' | 'agnello' | 'comunione' | 'maria' | 'finale';
  /**
   * Testo del canto pre-compilato. Presente quando il canto è di pubblico
   * dominio (classici latini, salmi biblici) e quindi possiamo includere
   * il testo confidenzialmente. Per canti italiani contemporanei lasciamo
   * vuoto: l'utente incolla manualmente le strofe — è la prassi normale
   * per i libretti messa, dato che i canti vengono scelti col coro.
   */
  testo?: string;
}

const TESTO_AVE_MARIA_LATINA = `Ave Maria, gratia plena,
Dominus tecum,
benedicta tu in mulieribus,
et benedictus fructus ventris tui, Iesus.

Sancta Maria, Mater Dei,
ora pro nobis peccatoribus,
nunc et in hora mortis nostrae.
Amen.`;

const TESTO_MAGNIFICAT_LATINO = `Magnificat anima mea Dominum,
et exsultavit spiritus meus in Deo salutari meo,
quia respexit humilitatem ancillae suae;
ecce enim ex hoc beatam me dicent omnes generationes.

Quia fecit mihi magna qui potens est,
et sanctum nomen eius,
et misericordia eius a progenie in progenies
timentibus eum.

Fecit potentiam in brachio suo,
dispersit superbos mente cordis sui;
deposuit potentes de sede,
et exaltavit humiles;
esurientes implevit bonis,
et divites dimisit inanes.

Suscepit Israel puerum suum,
recordatus misericordiae suae,
sicut locutus est ad patres nostros,
Abraham et semini eius in saecula.

Gloria Patri, et Filio, et Spiritui Sancto.
Sicut erat in principio, et nunc et semper,
et in saecula saeculorum. Amen.`;

const TESTO_SALVE_REGINA = `Salve, Regina, Mater misericordiae,
vita, dulcedo et spes nostra, salve.
Ad te clamamus, exsules filii Hevae.
Ad te suspiramus, gementes et flentes
in hac lacrimarum valle.

Eia ergo, advocata nostra,
illos tuos misericordes oculos ad nos converte.
Et Iesum, benedictum fructum ventris tui,
nobis post hoc exsilium ostende.

O clemens, o pia, o dulcis Virgo Maria.`;

const TESTO_VENI_CREATOR = `Veni, Creator Spiritus,
mentes tuorum visita,
imple superna gratia,
quae tu creasti pectora.

Qui diceris Paraclitus,
altissimi donum Dei,
fons vivus, ignis, caritas
et spiritalis unctio.

Tu septiformis munere,
digitus paternae dexterae,
tu rite promissum Patris,
sermone ditans guttura.

Accende lumen sensibus,
infunde amorem cordibus,
infirma nostri corporis,
virtute firmans perpeti.`;

/* ─────────────────────────────────────────────────────────────────────────
 * Canti — TUTTI in pubblico dominio.
 * I canti contemporanei italiani (Frisina, Sequeri, Argüello, Taizé, ecc.)
 * sono stati rimossi: il loro testo è coperto da SIAE / copyright autoriale
 * e non può essere ridistribuito da una piattaforma SaaS senza licenza.
 * Restano solo inni gregoriani / latini classici / mariani PD.
 * ──────────────────────────────────────────────────────────────────────── */

const TESTO_UBI_CARITAS = `Ubi caritas et amor, Deus ibi est.

Congregavit nos in unum Christi amor.
Exsultemus, et in ipso iucundemur.
Timeamus, et amemus Deum vivum.
Et ex corde diligamus nos sincero.

Ubi caritas et amor, Deus ibi est.

Simul ergo cum in unum congregamur:
ne nos mente dividamur, caveamus.
Cessent iurgia maligna, cessent lites.
Et in medio nostri sit Christus Deus.

Ubi caritas et amor, Deus ibi est.`;

const TESTO_PANIS_ANGELICUS = `Panis angelicus
fit panis hominum;
dat panis cælicus
figuris terminum:
o res mirabilis!
Manducat Dominum
pauper, servus, et humilis.

Te trina Deitas
unaque poscimus:
sic nos tu visita,
sicut te colimus;
per tuas semitas
duc nos quo tendimus,
ad lucem quam inhabitas.
Amen.`;

const TESTO_ADORO_TE_DEVOTE = `Adoro te devote, latens Deitas,
quæ sub his figuris vere latitas:
tibi se cor meum totum subiicit,
quia te contemplans totum deficit.

Visus, tactus, gustus in te fallitur,
sed auditu solo tuto creditur:
credo quidquid dixit Dei Filius;
nil hoc verbo Veritatis verius.

In cruce latebat sola Deitas,
at hic latet simul et humanitas:
ambo tamen credens atque confitens,
peto quod petivit latro pœnitens.`;

const TESTO_TANTUM_ERGO = `Tantum ergo Sacramentum
veneremur cernui:
et antiquum documentum
novo cedat ritui:
præstet fides supplementum
sensuum defectui.

Genitori, Genitoque
laus et iubilatio,
salus, honor, virtus quoque
sit et benedictio:
procedenti ab utroque
compar sit laudatio.
Amen.`;

const TESTO_PANGE_LINGUA = `Pange, lingua, gloriosi
Corporis mysterium,
Sanguinisque pretiosi,
quem in mundi pretium
fructus ventris generosi
Rex effudit gentium.

Nobis datus, nobis natus
ex intacta Virgine,
et in mundo conversatus,
sparso verbi semine,
sui moras incolatus
miro clausit ordine.`;

const TESTO_ALLELUIA_GREGORIANO = `Alleluia, alleluia, alleluia.
Alleluia, alleluia, alleluia.`;

export const CANTI_SUGGERITI: CantoSuggerito[] = [
  // INGRESSO
  { titolo: 'Veni Creator Spiritus', momento: 'ingresso', testo: TESTO_VENI_CREATOR },
  // ALLELUIA
  { titolo: 'Alleluia', momento: 'alleluia', testo: TESTO_ALLELUIA_GREGORIANO },
  // OFFERTORIO
  { titolo: 'Ubi caritas (gregoriano)', momento: 'offertorio', testo: TESTO_UBI_CARITAS },
  // COMUNIONE
  { titolo: 'Panis Angelicus', momento: 'comunione', testo: TESTO_PANIS_ANGELICUS },
  { titolo: 'Adoro te devote', momento: 'comunione', testo: TESTO_ADORO_TE_DEVOTE },
  { titolo: 'Tantum ergo', momento: 'comunione', testo: TESTO_TANTUM_ERGO },
  { titolo: 'Pange lingua', momento: 'comunione', testo: TESTO_PANGE_LINGUA },
  // MARIA
  { titolo: 'Ave Maria (latino)', momento: 'maria', testo: TESTO_AVE_MARIA_LATINA },
  { titolo: 'Ave Maria (Schubert)', momento: 'maria', testo: TESTO_AVE_MARIA_LATINA },
  { titolo: 'Ave Maria (Gounod)', momento: 'maria', testo: TESTO_AVE_MARIA_LATINA },
  { titolo: 'Salve Regina (latino)', momento: 'maria', testo: TESTO_SALVE_REGINA },
  // FINALE
  { titolo: 'Magnificat (latino)', momento: 'finale', testo: TESTO_MAGNIFICAT_LATINO },
];

/**
 * Risolve il testo standard per qualsiasi pagina-tipo che usi un template
 * (memoria-battesimo, gloria, colletta, ecc., più consenso/anelli/interrogazioni).
 * Usato per pre-popolare il textarea quando l'utente switcha da "Testo standard"
 * a "Scrivi il tuo testo" — così non parte da pagina bianca ma può editare.
 *
 * Ritorna stringa vuota se la pagina non ha template (lettura, salmo, ecc.).
 */
export function resolveDefaultTemplateText(
  page: { type: string; forma?: string },
  sposo1: string,
  sposo2: string,
): string {
  switch (page.type) {
    case 'memoria-battesimo': return fillSpouses(TESTO_MEMORIA_BATTESIMO, sposo1, sposo2);
    case 'gloria': return TESTO_GLORIA;
    case 'colletta': return fillSpouses(TESTO_COLLETTA, sposo1, sposo2);
    case 'orazione-offerte': return fillSpouses(TESTO_ORAZIONE_OFFERTE, sposo1, sposo2);
    case 'rito-pace': return TESTO_RITO_PACE;
    case 'agnello-dio': return TESTO_AGNELLO_DIO;
    case 'orazione-comunione': return fillSpouses(TESTO_ORAZIONE_COMUNIONE, sposo1, sposo2);
    case 'atto-matrimonio-civile': return fillSpouses(TESTO_ATTO_MATRIMONIO_CIVILE, sposo1, sposo2);
    case 'interrogazioni': return fillSpouses(TESTO_INTERROGAZIONI, sposo1, sposo2);
    case 'consenso':
      return page.forma === 'dichiarativo'
        ? fillSpouses(TESTO_CONSENSO_DICHIARATIVO, sposo1, sposo2)
        : fillSpouses(TESTO_CONSENSO_INTERROGATIVO, sposo1, sposo2);
    case 'anelli': return fillSpouses(TESTO_BENEDIZIONE_ANELLI, sposo1, sposo2);
    default: return '';
  }
}

/**
 * Sostituisce i placeholder con i nomi degli sposi.
 *
 * Convenzione FISSA: `sposo1` = LO SPOSO (uomo), `sposo2` = LA SPOSA
 * (donna). Garantita dai label espliciti del cover-editor.
 *
 * Placeholder disponibili nei template:
 *   {sposo1}, {sposo2} — equivalenti a {sposo}, {sposa} (per retrocompat).
 *   {sposo}            — lo sposo (= sposo1)
 *   {sposa}            — la sposa (= sposo2)
 */
export function fillSpouses(text: string, sposo1: string, sposo2: string): string {
  const fallback = '___';
  const s1 = sposo1 || fallback;
  const s2 = sposo2 || fallback;
  return text
    .replaceAll('{sposo1}', s1)
    .replaceAll('{sposo2}', s2)
    .replaceAll('{sposo}', s1)
    .replaceAll('{sposa}', s2);
}

export const TESTO_INTERROGAZIONI = `Carissimi {sposo1} e {sposo2}, siete venuti a celebrare il vostro matrimonio senza alcuna costrizione, in piena libertà e consapevoli del significato della vostra decisione?

Siete disposti, seguendo la via del matrimonio, ad amarvi e onorarvi l'un l'altro per tutti i giorni della vostra vita?

Siete disposti ad accogliere responsabilmente e con amore i figli che Dio vorrà donarvi e a educarli secondo la legge di Cristo e della sua Chiesa?`;

export const TESTO_CONSENSO_DICHIARATIVO = `Io {sposo1}, accolgo te {sposo2} come mia sposa. Con la grazia di Cristo prometto di esserti fedele sempre, nella gioia e nel dolore, nella salute e nella malattia, e di amarti e onorarti tutti i giorni della mia vita.

Io {sposo2}, accolgo te {sposo1} come mio sposo. Con la grazia di Cristo prometto di esserti fedele sempre, nella gioia e nel dolore, nella salute e nella malattia, e di amarti e onorarti tutti i giorni della mia vita.`;

export const TESTO_CONSENSO_INTERROGATIVO = `Celebrante: {sposo1}, vuoi accogliere {sposo2} come tua sposa, nel Signore, e prometti di esserle fedele sempre, nella gioia e nel dolore, nella salute e nella malattia, e di amarla e onorarla tutti i giorni della tua vita?
Sposo: Sì, lo voglio.

Celebrante: {sposo2}, vuoi accogliere {sposo1} come tuo sposo, nel Signore, e prometti di essergli fedele sempre, nella gioia e nel dolore, nella salute e nella malattia, e di amarlo e onorarlo tutti i giorni della tua vita?
Sposa: Sì, lo voglio.`;

export const TESTO_BENEDIZIONE_ANELLI = `Il Signore benedica questi anelli che vi scambiate in segno di amore e di fedeltà.

Sposo: {sposo2}, ricevi questo anello, segno del mio amore e della mia fedeltà. Nel nome del Padre e del Figlio e dello Spirito Santo.
Sposa: {sposo1}, ricevi questo anello, segno del mio amore e della mia fedeltà. Nel nome del Padre e del Figlio e dello Spirito Santo.`;

/* ─────────────────────────────────────────────────────────────────────────
 * BENEDIZIONI NUZIALI
 *
 * Le 4 formule ufficiali del Rito del Matrimonio CEI 2008 (nn. 85-88),
 * estratte parola-per-parola dal testo ufficiale. Le parti tra parentesi
 * quadre [ ... ] sono OMETTIBILI dal celebrante a seconda delle circostanze
 * (es. sposi in età avanzata, sposi che non ricevono l'Eucaristia). Le
 * lasciamo nel testo per default — l'utente può cancellarle in modalità
 * "scrivi a mano" se la sua celebrazione le omette.
 * ──────────────────────────────────────────────────────────────────────── */

export interface BenedizioneFormula {
  id: string;
  /** Numero nel Rito CEI (85, 86, 87, 88). */
  numero: 85 | 86 | 87 | 88;
  /** Etichetta breve per dropdown (es. "Prima formula"). */
  titolo: string;
  /** Incipit per descrizione/preview (prime parole della preghiera principale). */
  incipit: string;
  /** Testo completo della preghiera (quella che il sacerdote pronuncia
   *  tenendo le mani stese sugli sposi), con {sposo1}/{sposo2} placeholder. */
  testoCompleto: string;
}

const TESTO_BENEDIZIONE_NUZIALE_85 = `O Dio, con la tua onnipotenza
hai creato dal nulla tutte le cose
e nell'ordine primordiale dell'universo
hai formato l'uomo e la donna a tua immagine,
donandoli l'uno all'altro
come sostegno inseparabile,
perché siano non più due,
ma una sola carne;
così hai insegnato
che non è mai lecito separare
ciò che tu hai costituito in unità.

O Dio, in un mistero così grande
hai consacrato l'unione degli sposi
e hai reso il patto coniugale
sacramento di Cristo e della Chiesa.

O Dio, in te, la donna e l'uomo si uniscono,
e la prima comunità umana, la famiglia,
riceve in dono quella benedizione
che nulla poté cancellare,
né il peccato originale
né le acque del diluvio.

Guarda ora con bontà questi tuoi figli
che, uniti nel vincolo del Matrimonio,
chiedono l'aiuto della tua benedizione:
effondi su di loro la grazia dello Spirito Santo
perché, con la forza del tuo amore
diffuso nei loro cuori,
rimangano fedeli al patto coniugale.

In questa tua figlia {sposa}
dimori il dono dell'amore e della pace
e sappia imitare le donne sante
lodate dalla Scrittura.

{sposo}, suo sposo,
viva con lei in piena comunione,
la riconosca partecipe dello stesso dono di grazia,
la onori come uguale nella dignità,
la ami sempre con quell'amore
con il quale Cristo ha amato la sua Chiesa.

Ti preghiamo, Signore,
affinché questi tuoi figli rimangano uniti nella fede
e nell'obbedienza ai tuoi comandamenti;
fedeli a un solo amore,
siano esemplari per integrità di vita;
sostenuti dalla forza del Vangelo,
diano a tutti buona testimonianza di Cristo.

[Sia feconda la loro unione,
diventino genitori saggi e forti
e insieme possano vedere i figli dei loro figli].

E dopo una vita lunga e serena
giungano alla beatitudine eterna del regno dei cieli.
Per Cristo nostro Signore.
Tutti: Amen.`;

const TESTO_BENEDIZIONE_NUZIALE_86 = `Padre santo, tu hai fatto l'uomo a tua immagine:
maschio e femmina li hai creati,
perché l'uomo e la donna,
uniti nel corpo e nello spirito,
fossero collaboratori della tua creazione.

O Dio, per rivelare il disegno del tuo amore
hai voluto adombrare
nella comunione di vita degli sposi
quel patto di alleanza che hai stabilito con il tuo popolo,
perché, nell'unione coniugale dei tuoi fedeli,
realizzata pienamente nel sacramento,
si manifesti il mistero nuziale di Cristo e della Chiesa.

O Dio, stendi la tua mano su {sposo1} e {sposo2}
ed effondi nei loro cuori la forza dello Spirito Santo.
Fa', o Signore, che, nell'unione da te consacrata,
condividano i doni del tuo amore
e, diventando l'uno per l'altro segno della tua presenza,
siano un cuore solo e un'anima sola.

Dona loro, Signore,
di sostenere anche con le opere la casa che oggi edificano.
[Alla scuola del Vangelo preparino i loro figli
a diventare membri della tua Chiesa].

Dona a questa sposa {sposa} benedizione su benedizione:
perché, come moglie [e madre],
diffonda la gioia nella casa
e la illumini con generosità e dolcezza.

Guarda con paterna bontà {sposo}, suo sposo:
perché, forte della tua benedizione,
adempia con fedeltà la sua missione di marito [e di padre].

Padre santo, concedi a questi tuoi figli
che, uniti davanti a te come sposi,
comunicano alla tua mensa,
di partecipare insieme con gioia al banchetto del cielo.
Per Cristo nostro Signore.
Tutti: Amen.`;

const TESTO_BENEDIZIONE_NUZIALE_87 = `Padre santo, creatore dell'universo,
che hai formato l'uomo e la donna a tua immagine
e hai voluto benedire la loro unione,
ti preghiamo umilmente per questi tuoi figli,
che oggi si uniscono con il sacramento nuziale.

R. Ti lodiamo, Signore, e ti benediciamo
Eterno è il tuo amore per noi.

Scenda, o Signore, su questi sposi {sposo1} e {sposo2}
la ricchezza delle tue benedizioni,
e la forza del tuo Santo Spirito
infiammi dall'alto i loro cuori,
perché nel dono reciproco dell'amore
allietino di figli la loro famiglia e la comunità ecclesiale.

R. Ti supplichiamo, Signore
Ascolta la nostra preghiera.

Ti lodino, Signore, nella gioia,
ti cerchino nella sofferenza;
godano del tuo sostegno nella fatica
e del tuo conforto nella necessità;
ti preghino nella santa assemblea,
siano tuoi testimoni nel mondo.

Vivano a lungo nella prosperità e nella pace
e, con tutti gli amici che ora li circondano,
giungano alla felicità del tuo regno.
Per Cristo nostro Signore.
Tutti: Amen.`;

const TESTO_BENEDIZIONE_NUZIALE_88 = `O Dio, Padre di ogni bontà,
nel tuo disegno d'amore hai creato l'uomo e la donna
perché, nella reciproca dedizione,
con tenerezza e fecondità vivessero lieti nella comunione.

R. Ti lodiamo, Signore, e ti benediciamo
Eterno è il tuo amore per noi.

Quando venne la pienezza dei tempi
hai mandato il tuo Figlio, nato da donna.
A Nazareth,
gustando le gioie
e condividendo le fatiche di ogni famiglia umana,
è cresciuto in sapienza e grazia.
A Cana di Galilea,
cambiando l'acqua in vino,
è divenuto presenza di gioia nella vita degli sposi.
Nella croce,
si è abbassato fin nell'estrema povertà
dell'umana condizione,
e tu, o Padre, hai rivelato un amore
sconosciuto ai nostri occhi,
un amore disposto a donarsi senza chiedere nulla in cambio.

R. Ti lodiamo, Signore, e ti benediciamo
Eterno è il tuo amore per noi.

Con l'effusione dello Spirito del Risorto
hai concesso alla Chiesa
di accogliere nel tempo la tua grazia
e di santificare i giorni di ogni uomo.

R. Ti lodiamo, Signore, e ti benediciamo
Eterno è il tuo amore per noi.

Ora, Padre, guarda {sposo1} e {sposo2},
che si affidano a te:
trasfigura quest'opera che hai iniziato in loro
e rendila segno della tua carità.
Scenda la tua benedizione su questi sposi,
perché, segnati col fuoco dello Spirito,
diventino Vangelo vivo tra gli uomini.

[Siano guide sagge e forti dei figli
che allieteranno la loro famiglia e la comunità.]

R. Ti supplichiamo, Signore
Ascolta la nostra preghiera.

Siano lieti nella speranza,
forti nella tribolazione,
perseveranti nella preghiera,
solleciti per le necessità dei fratelli,
premurosi nell'ospitalità.
Non rendano a nessuno male per male,
benedicano e non maledicano,
vivano a lungo e in pace con tutti.

R. Ti supplichiamo, Signore
Ascolta la nostra preghiera.

Il loro amore, Padre,
sia seme del tuo regno.
Custodiscano nel cuore una profonda nostalgia di te
fino al giorno in cui potranno,
con i loro cari, lodare in eterno il tuo nome.
Per Cristo nostro Signore.
Tutti: Amen.`;

export const BENEDIZIONI_NUZIALI: BenedizioneFormula[] = [
  {
    id: 'ben-85',
    numero: 85,
    titolo: 'Prima formula',
    incipit: `O Dio, con la tua onnipotenza hai creato dal nulla tutte le cose…`,
    testoCompleto: TESTO_BENEDIZIONE_NUZIALE_85,
  },
  {
    id: 'ben-86',
    numero: 86,
    titolo: 'Seconda formula',
    incipit: `Padre santo, tu hai fatto l'uomo a tua immagine…`,
    testoCompleto: TESTO_BENEDIZIONE_NUZIALE_86,
  },
  {
    id: 'ben-87',
    numero: 87,
    titolo: 'Terza formula',
    incipit: `Padre santo, creatore dell'universo…`,
    testoCompleto: TESTO_BENEDIZIONE_NUZIALE_87,
  },
  {
    id: 'ben-88',
    numero: 88,
    titolo: 'Quarta formula',
    incipit: `O Dio, Padre di ogni bontà…`,
    testoCompleto: TESTO_BENEDIZIONE_NUZIALE_88,
  },
];

export function findBenedizioneNuziale(id: string): BenedizioneFormula | undefined {
  return BENEDIZIONI_NUZIALI.find((b) => b.id === id);
}

/* ─────────────────────────────────────────────────────────────────────────
 * Template per i nuovi tipi di pagina (struttura tipica libretto messa)
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * Saluto liturgico iniziale (Riti di Introduzione).
 * Dialogo standard CEI tra celebrante e assemblea all'apertura della Messa.
 */
export const TESTO_RITI_INTRODUZIONE = `Sac: Nel nome del Padre e del Figlio e dello Spirito Santo.
Tutti: Amen.

Sac: Il Signore che guida i nostri cuori nell'amore e nella pazienza di Cristo, sia con tutti voi.
Tutti: E con il tuo spirito.`;

export const TESTO_MEMORIA_BATTESIMO = `Sac: {sposo1} e {sposo2}, la Chiesa partecipa alla vostra gioia e insieme con i vostri cari vi accoglie con grande affetto nel giorno in cui davanti a Dio, nostro Padre, decidete di realizzare la comunione di tutta la vita. In questo giorno per voi di festa il Signore vi ascolti. Mandi dal cielo il suo aiuto e vi custodisca. Realizzi i desideri del vostro cuore ed esaudisca le vostre preghiere.

Riconoscenti per essere divenuti figli nel Figlio, facciamo ora memoria del Battesimo, dal quale, come da seme fecondo, nasce e prende vigore l'impegno di vivere fedeli nell'amore.

Sac: Padre, nel Battesimo del tuo Figlio Gesù al fiume Giordano hai rivelato al mondo l'amore sponsale per il tuo popolo.
Tutti: Noi ti lodiamo e ti rendiamo grazie.

Sac: Cristo Gesù, dal tuo costato aperto sulla Croce hai generato la Chiesa, tua diletta sposa.
Tutti: Noi ti lodiamo e ti rendiamo grazie.

Sac: Spirito Santo, potenza del Padre e del Figlio, oggi fai risplendere in {sposo1} e {sposo2} la veste nuziale della Chiesa.
Tutti: Noi ti lodiamo e ti rendiamo grazie.

Sac: Dio onnipotente, origine e fonte della vita, ravviva in tutti noi la grazia del Battesimo e concedi a {sposo1} e {sposo2} un cuore libero e una fede ardente perché, purificati nell'intimo, accolgano il dono del Matrimonio come nuova via della loro santificazione. Per Cristo nostro Signore.
Tutti: Amen.`;

export const TESTO_GLORIA = `Gloria a Dio nell'alto dei cieli
e pace in terra agli uomini di buona volontà.
Noi ti lodiamo, ti benediciamo,
ti adoriamo, ti glorifichiamo,
ti rendiamo grazie per la tua gloria immensa,
Signore Dio, Re del cielo, Dio Padre onnipotente.
Signore, Figlio unigenito, Gesù Cristo,
Signore Dio, Agnello di Dio, Figlio del Padre,
tu che togli i peccati del mondo, abbi pietà di noi;
tu che togli i peccati del mondo, accogli la nostra supplica;
tu che siedi alla destra del Padre, abbi pietà di noi.
Perché tu solo il Santo, tu solo il Signore,
tu solo l'Altissimo, Gesù Cristo,
con lo Spirito Santo nella gloria di Dio Padre.
Amen.`;

export const TESTO_COLLETTA = `Sac: Preghiamo. O Dio, che fin dagli inizi della creazione hai voluto l'unità fra l'uomo e la donna, congiungi con il vincolo di un solo amore questi tuoi figli, {sposo1} e {sposo2}, che oggi si uniscono nel Matrimonio, e fa' che siano testimoni di quella carità che hai loro donato. Per il nostro Signore Gesù Cristo, tuo Figlio, che è Dio, e vive e regna con te, nell'unità dello Spirito Santo, per tutti i secoli dei secoli.
Tutti: Amen.`;

export const SANTI_DEFAULT = [
  'Santa Maria, Madre di Dio',
  'Santa Maria, Madre della Chiesa',
  'San Giuseppe, Sposo di Maria',
  'Santi Angeli di Dio',
  'Santi Gioacchino e Anna',
  'Santi Zaccaria ed Elisabetta',
  'San Giovanni Battista',
  'Santi Pietro e Paolo',
  'Santi Apostoli ed Evangelisti',
  'Santi Martiri di Cristo',
  'Tutti i Santi e le Sante di Dio',
];

export const TESTO_LITANIE_SANTI_INTRO = `Sac: Ora, in comunione con la Chiesa del cielo, invochiamo l'intercessione dei Santi.`;

export const TESTO_LITANIE_RESPONSE = `pregate per noi`;

export const TESTO_ORAZIONE_OFFERTE = `Sac: O Dio, Padre di bontà, accogli il pane e il vino che la tua famiglia ti offre con intima gioia, e custodisci nel tuo amore {sposo1} e {sposo2}, che hai unito con il sacramento nuziale. Per Cristo nostro Signore.
Tutti: Amen.`;

export const TESTO_RITO_PACE = `Sac: Signore Gesù Cristo, che hai detto ai tuoi apostoli: «Vi lascio la pace, vi do la mia pace», non guardare ai nostri peccati, ma alla fede della tua Chiesa, e donale unità e pace secondo la tua volontà. Tu che vivi e regni nei secoli dei secoli.
Tutti: Amen.

Sac: La pace del Signore sia sempre con voi.
Tutti: E con il tuo spirito.

Sac: Scambiatevi un segno di pace.`;

export const TESTO_AGNELLO_DIO = `Agnello di Dio, che togli i peccati del mondo, abbi pietà di noi.
Agnello di Dio, che togli i peccati del mondo, abbi pietà di noi.
Agnello di Dio, che togli i peccati del mondo, dona a noi la pace.

Sac: Ecco l'Agnello di Dio, ecco colui che toglie i peccati del mondo. Beati gli invitati alla cena dell'Agnello.
Tutti: O Signore, non sono degno di partecipare alla tua mensa, ma di' soltanto una parola e io sarò salvato.`;

export const TESTO_ORAZIONE_COMUNIONE = `Sac: O Padre, che ci hai accolti alla tua mensa, concedi a questa nuova famiglia, consacrata dalla tua benedizione, di essere sempre fedele a Te e di testimoniare il tuo amore nella comunità dei fratelli. Per Cristo nostro Signore.
Tutti: Amen.`;

/* ─────────────────────────────────────────────────────────────────────────
 * Benedizioni finali — 3 formule ufficiali CEI 2008 (Rito del Matrimonio,
 * n. 92, p. 62-64). Ogni formula = 3 benedizioni specifiche + benedizione
 * trinitaria comune. Risposta "Amen" implicita dopo ciascuna.
 * ──────────────────────────────────────────────────────────────────────── */

export interface BenedizioneFinaleFormula {
  id: 'fin-1' | 'fin-2' | 'fin-3';
  numero: 1 | 2 | 3;
  titolo: string;
  incipit: string;
  /** Le 4 benedizioni (3 specifiche + trinitaria finale comune). */
  benedizioni: string[];
}

const BENEDIZIONE_TRINITARIA_FINALE =
  'E su voi tutti, che avete partecipato a questa liturgia nuziale, scenda la benedizione di Dio onnipotente, Padre e Figlio ✠ e Spirito Santo.';

export const BENEDIZIONI_FINALI: BenedizioneFinaleFormula[] = [
  {
    id: 'fin-1',
    numero: 1,
    titolo: 'Prima formula',
    incipit: 'Dio, eterno Padre, vi conservi uniti nel reciproco amore…',
    benedizioni: [
      'Dio, eterno Padre, vi conservi uniti nel reciproco amore; la pace di Cristo abiti in voi e rimanga sempre nella vostra casa.',
      'Abbiate benedizione nei figli, conforto dagli amici, vera pace con tutti.',
      'Siate nel mondo testimoni dell\'amore di Dio, perché i poveri e i sofferenti, che avranno sperimentato la vostra carità, vi accolgano grati un giorno nella casa del Padre.',
      BENEDIZIONE_TRINITARIA_FINALE,
    ],
  },
  {
    id: 'fin-2',
    numero: 2,
    titolo: 'Seconda formula',
    incipit: 'Dio, Padre onnipotente, vi comunichi la sua gioia…',
    benedizioni: [
      'Dio, Padre onnipotente, vi comunichi la sua gioia e vi benedica con il dono dei figli.',
      'L\'unigenito Figlio di Dio vi sia vicino e vi assista nell\'ora della serenità e nell\'ora della prova.',
      'Lo Spirito Santo di Dio effonda sempre il suo amore nei vostri cuori.',
      BENEDIZIONE_TRINITARIA_FINALE,
    ],
  },
  {
    id: 'fin-3',
    numero: 3,
    titolo: 'Terza formula',
    incipit: 'Il Signore Gesù, che santificò le nozze di Cana…',
    benedizioni: [
      'Il Signore Gesù, che santificò le nozze di Cana, benedica voi, i vostri parenti e i vostri amici.',
      'Cristo, che ha amato la sua Chiesa sino alla fine, effonda continuamente nei vostri cuori il suo stesso amore.',
      'Il Signore conceda a voi, che testimoniate la fede nella sua risurrezione, di attendere nella gioia che si compia la beata speranza.',
      BENEDIZIONE_TRINITARIA_FINALE,
    ],
  },
];

export function findBenedizioneFinale(id: string): BenedizioneFinaleFormula | undefined {
  return BENEDIZIONI_FINALI.find((b) => b.id === id);
}

/** @deprecated Mantenuto per back-compat libretti pre-formule. Usa
 *  `BENEDIZIONI_FINALI[0].benedizioni` per la prima formula completa. */
export const BENEDIZIONI_FINALI_DEFAULT = BENEDIZIONI_FINALI[0]!.benedizioni.slice(0, 3);

export const TESTO_RITI_CONCLUSIONE_CHIUSURA = `Sac: Nella Chiesa e nel mondo siate testimoni del dono della vita e dell'amore che avete celebrato. Andate in pace.
Tutti: Rendiamo grazie a Dio.`;

export const TESTO_ATTO_MATRIMONIO_CIVILE = `Carissimi {sposo1} e {sposo2}, avete celebrato il sacramento del Matrimonio manifestando il vostro consenso dinanzi a me ed ai testimoni. Oltre la grazia divina e gli effetti stabiliti dai sacri Canoni, il vostro Matrimonio produce anche gli effetti civili secondo le leggi dello Stato.

Vi do quindi lettura degli articoli del Codice civile riguardanti i diritti e i doveri dei coniugi che voi siete tenuti a rispettare ed osservare:

Art. 143. Con il matrimonio il marito e la moglie acquistano gli stessi diritti e assumono i medesimi doveri. Dal matrimonio deriva l'obbligo reciproco alla fedeltà, all'assistenza morale e materiale, alla collaborazione nell'interesse della famiglia e alla coabitazione. Entrambi i coniugi sono tenuti, ciascuno in relazione alle proprie sostanze e alla propria capacità di lavoro professionale o casalingo, a contribuire ai bisogni della famiglia.

Art. 144. I coniugi concordano tra loro l'indirizzo della vita familiare e fissano la residenza della famiglia secondo le esigenze di entrambi e quelle preminenti della famiglia stessa. A ciascuno dei coniugi spetta il potere di attuare l'indirizzo concordato.

Art. 147. Il matrimonio impone ad ambedue i coniugi l'obbligo di mantenere, istruire, educare e assistere moralmente i figli, nel rispetto delle loro capacità, inclinazioni naturali e aspirazioni, secondo quanto previsto dall'articolo 315-bis.`;

export type Postura = 'piedi' | 'seduti' | 'ginocchio' | 'nessuna';

export const LABEL_POSTURA: Record<Postura, string> = {
  piedi: 'In piedi',
  seduti: 'Seduti',
  ginocchio: 'In ginocchio',
  nessuna: '',
};

