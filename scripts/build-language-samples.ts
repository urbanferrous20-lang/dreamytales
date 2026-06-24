/**
 * Build isiXhosa sample PDF.
 * Run: npm run sample:languages
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import fs from "fs/promises";
import path from "path";
import { assembleStoryPdf } from "../lib/pdf-builder/layout";

const ASSETS_DIR = path.join(process.cwd(), "assets");
const OUTPUT_DIR = path.join(process.cwd(), "storage", "stories");

const isiXhosaSample = {
  title: "ULethu noMbombeli yoBusuku",
  childName: "Lethu",
  pages: [
    {
      pageNumber: 1,
      text: "Emva kwesikhathi sokulala, uLethu wayengaphandle kwesigcawu eKapa. uMlibo waseKapa wawumfulele. Imithi ye-jacaranda yayigcwele amahlamvu, kwaye umoya waseAtlantiki wawupholile.",
    },
    {
      pageNumber: 2,
      text: "uLethu wayethanda izilwanyana. Iimpuku. Iintaka. Neentlobo. Ngobusuku obu, wabona umbombeli omncinci onemibala emihle ebhukeni elisegcekeni.",
    },
    {
      pageNumber: 3,
      text: "Umbombeli waphaphazela kancinci — waza wama emoyeni. uLethu wathi, \"Molo wena mncinane.\" Umbombeli waphendula ngokunciphisa, njengokukhanya kwenyanga.",
    },
    {
      pageNumber: 4,
      text: "\"NdinguKhanya,\" yathi intshona encinane. \"Bonke abantwana baseKapa bathumela umthandazo wabo ngomoya wasebusuku. Namhlanje ngowakho.\"",
    },
    {
      pageNumber: 5,
      text: "uLethu uthe, \"Ndifuna ukubona iKapa yam yonke — intaba, ulwandle, nezindlu zethu.\" uKhanya yancuma. \"Imithandazo emihle iyafuneka iintliziyo ezimnandi.\"",
    },
    {
      pageNumber: 6,
      text: "Umbombeli wakhanya ngokubhazamfa, ngemibala egqamileyo. Waba nentsiba ezintathu ezincinci zomoya. \"Landela umoya,\" yathi uKhanya. \"Kodwa ungaphumi kude nesigcawu sakho.\"",
    },
    {
      pageNumber: 7,
      text: "uLethu walandela umbombeli phezulu — phezulu kancinci nje. Wabona iindawo zokuhlala, amabala, neentaba. Konke kwakukhanya kancinci, kwaye kwakuthule.",
    },
    {
      pageNumber: 8,
      text: "Badlula phezu kweendlela zolwandle. Imikhumbi yayithule njengamaphupha. iTable Mountain yayimkhulu, imfulele, ifana nengcwele yaseKapa.",
    },
    {
      pageNumber: 9,
      text: "Emva kwexesha elincinane, umbombeli wahla wahla, waza wahlala ehlathini lasegcekeni. uLethu wancuma. Ubusuku babebusuku obuhle.",
    },
    {
      pageNumber: 10,
      text: "uLethu wangena ekhayeni lwakhe wayolala. uKhanya yathi, \"Ulale kamnandi, Lethu. IKapa iyakukhusela ubuthongo bakho.\" Waza wamka ngokuthula.",
    },
  ],
};

async function loadImage(pageNumber: number): Promise<Buffer | undefined> {
  const imagePath = path.join(ASSETS_DIR, `morne-page-${pageNumber}.png`);
  try {
    return await fs.readFile(imagePath);
  } catch {
    return undefined;
  }
}

async function main() {
  console.log("Building isiXhosa sample...");
  const pdfBytes = await assembleStoryPdf({
    title: isiXhosaSample.title,
    childName: isiXhosaSample.childName,
    pages: isiXhosaSample.pages,
    loadImage,
  });

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const outPath = path.join(OUTPUT_DIR, `sample-isixhosa-${Date.now()}.pdf`);
  await fs.writeFile(outPath, pdfBytes);
  console.log("→", path.resolve(outPath));
}

main().catch(console.error);
