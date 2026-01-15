// ============================================================
// 🎮 CATÁLOGO DE JUEGOS - LA CUEVA DE LOS VÍRGENES 🎮
// ============================================================
// 
// INSTRUCCIONES PARA AGREGAR JUEGOS:
// 1. Copia el template de abajo y pégalo al final del array "games"
// 2. Rellena cada campo según se indica
// 3. Guarda el archivo y listo!
//
// TEMPLATE:
// {
//   id: [número único],
//   title: "NOMBRE DEL JUEGO",
//   description: "Descripción adicional (opcional)",
//   cover: "https://i.imgur.com/[ID_DE_IMAGEN].png",
//   genres: ["GENERO1", "GENERO2"],
//   platforms: ["PC", "SWITCH", "ANDROID", etc.],
//   downloads: {
//     PC: [
//       { name: "MediaFire", url: "https://..." },
//       { name: "Gofile", url: "https://..." },
//     ],
//     SWITCH: [
//       { name: "Juego Base", url: "https://..." },
//       { name: "Actualización", url: "https://..." },
//       { name: "DLC's", url: "https://..." },
//     ],
//     // ... más plataformas
//   }
// }
// ============================================================

export interface DownloadLink {
  name: string;
  url: string;
}

export interface GameDownloads {
  PC?: DownloadLink[];
  SWITCH?: DownloadLink[];
  ANDROID?: DownloadLink[];
  PS2?: DownloadLink[];
  WII?: DownloadLink[];
  GAMECUBE?: DownloadLink[];
  STEAM?: DownloadLink[];
  DEMO?: DownloadLink[];
  PLAY_STORE?: DownloadLink[];
  OFICIAL?: DownloadLink[];
}

export interface Game {
  id: number;
  title: string;
  description?: string;
  cover: string;
  genres: string[];
  platforms: string[];
  downloads: GameDownloads;
}

// Lista de géneros disponibles para filtrar
export const AVAILABLE_GENRES = [
  "DUNGEON", "DEPORTE", "DISPAROS", "ACCIÓN", "CARRERAS", 
  "PLATAFORMAS", "COOP", "PELEA", "RITMO", "TERROR", 
  "ROGUE-LIKE", "AVENTURA", "KART"
];

// Lista de plataformas disponibles
export const AVAILABLE_PLATFORMS = [
  "PC", "SWITCH", "ANDROID", "PS2", "PS1", "WII", "GAMECUBE", "STEAM"
];

// ============================================================
// 🎮 LISTA DE JUEGOS - EDITA AQUÍ ABAJO 🎮
// ============================================================
export const games: Game[] = [
  {
    id: 1,
    title: "MINECRAFT: DUNGEONS",
    cover: "https://i.imgur.com/HsEZ4CL.png",
    genres: ["DUNGEON"],
    platforms: ["PC", "SWITCH"],
    downloads: {
      PC: [
        { name: "MediaFire", url: "https://www.mediafire.com/file/7dh9yiuc0eh729q" },
        { name: "Gofile", url: "https://gofile.io/d/X84Xk0" },
      ],
      SWITCH: [
        { name: "Juego Base", url: "https://1fichier.com/?poag198jbgu4a1833eup&af=327151" },
        { name: "Actualización", url: "https://1fichier.com/?xebkn1eluhmvt42zluvy" },
        { name: "DLC's", url: "https://files3.cloud/switch-roms/Minecraft_Dungeons_7DLC.rar" },
      ],
    },
  },
  {
    id: 2,
    title: "PES 2013",
    cover: "https://i.imgur.com/WRhddL3.png",
    genres: ["DEPORTE"],
    platforms: ["PC"],
    downloads: {
      PC: [
        { name: "MediaFire", url: "https://www.mediafire.com/file/kidltqs7hx88c57/" },
        { name: "Gofile", url: "https://gofile.io/d/5IuyJ5" },
      ],
    },
  },
  {
    id: 3,
    title: "SERIOUS SAM 3 BFE",
    description: "Este juego no tiene formato portable, es tipo ISO, traído desde la página Blizzboygames, contraseña si tienen algún problema: www.blizzboygames.net",
    cover: "https://i.imgur.com/ZpE9JDd.png",
    genres: ["DISPAROS", "ACCIÓN"],
    platforms: ["PC"],
    downloads: {
      PC: [
        { name: "TORRENT (Mega)", url: "https://mega.nz/file/L34jlY4D#I4QlrykltzglvURDIUsoSNWrNElnGHAYIR1zXVEX5h0" },
        { name: "Google Drive Parte 1", url: "https://drive.google.com/file/d/1ZBqXzuGEYHGe48rTGbXiTpW4UDZFfUbr/edit" },
        { name: "Google Drive Parte 2", url: "https://drive.google.com/file/d/1PrIN1uMiINHdmkUOiYvwgTVxSw2mQgKd/edit" },
        { name: "Google Drive Parte 3", url: "https://drive.google.com/file/d/1Aq9MSjwjcIo3PogKxJ1bnQL0TlHVkfOy/edit" },
      ],
    },
  },
  {
    id: 4,
    title: "SONIC RIDERS",
    cover: "https://i.imgur.com/zdSocVz.png",
    genres: ["ACCIÓN", "CARRERAS"],
    platforms: ["PS2", "GAMECUBE"],
    downloads: {
      PS2: [
        { name: "MediaFire", url: "https://www.mediafire.com/file/4ze0miydsymf0ot" },
      ],
      GAMECUBE: [
        { name: "Romsfun", url: "https://sto.romsfast.com/GameCube-RVZ/Sonic%20Riders%20(Europe)%20(EnJaFrDeEsIt).zip?token=cH1ZalNgXU9HEG91XnYdYV9XQxlxd153Ug%3D%3D" },
      ],
    },
  },
  {
    id: 5,
    title: "NEW SUPER MARIO BROS (WII)",
    cover: "https://i.imgur.com/nuBBUBN.png",
    genres: ["PLATAFORMAS"],
    platforms: ["WII"],
    downloads: {
      WII: [
        { name: "Romspedia", url: "https://downloads.romspedia.com/roms/New%20Super%20Mario%20Bros%20Wii%20%5BSMNE01%5D.7z" },
      ],
    },
  },
  {
    id: 6,
    title: "MOVE OR DIE: UNLEASHED",
    cover: "https://i.imgur.com/8ylyCWY.png",
    genres: ["PLATAFORMAS", "COOP"],
    platforms: ["PC", "SWITCH"],
    downloads: {
      PC: [
        { name: "MediaFire", url: "https://www.mediafire.com/file/fvhqlgh96wxdt64/Move+or+Die-oNLY.rar/file" },
      ],
      SWITCH: [
        { name: "Juego Base", url: "https://1fichier.com/?gbu8x3kf92ytxr6obrn7" },
        { name: "Actualizaciones", url: "https://1fichier.com/?wc7rl0f85likhcp6xar6&af=1951572" },
      ],
    },
  },
  {
    id: 7,
    title: "DRAGON BALL FIGHTERZ",
    cover: "https://i.imgur.com/5LEwNEJ.png",
    genres: ["PELEA", "ACCIÓN"],
    platforms: ["PC", "SWITCH"],
    downloads: {
      PC: [
        { name: "MediaFire", url: "https://www.mediafire.com/file/nft5udazaskbwmt/Dragon+Ball+FighterZ+Opti+V2.7z/file" },
        { name: "Gofile", url: "https://gofile.io/d/Vztz7b" },
      ],
      SWITCH: [
        { name: "Juego (XCI)", url: "https://1fichier.com/?q7x10hvi5554mche19u6?af=5006637" },
        { name: "Actualización (v01.42)", url: "https://fileq.net/xsqi4wouwt8l.html" },
        { name: "DLC's", url: "https://1fichier.com/?pzgengxy2gdxjlye1rl1?af=5006637" },
      ],
    },
  },
  {
    id: 8,
    title: "TAIKO NO TATSUJIN",
    cover: "https://i.imgur.com/placeholder.png",
    genres: ["RITMO", "COOP"],
    platforms: ["PC", "SWITCH"],
    downloads: {
      PC: [
        { name: "Fileq", url: "https://fileq.net/g59zxqmyn2e5.html" },
      ],
      SWITCH: [
        { name: "Juego Base", url: "https://1fichier.com/?rny550dw2asm1gnfltns" },
        { name: "DLC's", url: "https://1fichier.com/?m3925vml6ascld5sykhr" },
        { name: "Actualizaciones", url: "https://1fichier.com/?qt4w6rrnf0n49u6zim7t&af=1951572" },
      ],
    },
  },
  {
    id: 9,
    title: "MORTAL KOMBAT 9",
    cover: "https://i.imgur.com/placeholder.png",
    genres: ["PELEA"],
    platforms: ["PC"],
    downloads: {
      PC: [
        { name: "MediaFire", url: "https://www.mediafire.com/file/gbnnyxakrp269st" },
        { name: "Gofile", url: "https://gofile.io/d/GDwRJK" },
      ],
    },
  },
  {
    id: 10,
    title: "MARIO KART WII",
    cover: "https://i.imgur.com/jCOhezO.png",
    genres: ["KART"],
    platforms: ["WII"],
    downloads: {
      WII: [
        { name: "Romspedia", url: "https://downloads.romspedia.com/roms/Mario%20Kart%20Wii%20%28USA%29%20%28En%2CFr%2CEs%29.zip" },
      ],
    },
  },
  {
    id: 11,
    title: "HOTLINE MIAMI 2",
    cover: "https://i.imgur.com/NRU0XnI.png",
    genres: ["ACCIÓN", "DISPAROS"],
    platforms: ["PC", "ANDROID"],
    downloads: {
      PC: [
        { name: "MediaFire", url: "https://www.mediafire.com/file/zvtuvj2dgte252a" },
        { name: "Filespayouts", url: "https://filespayouts.com/in6q4rli17yd" },
      ],
      ANDROID: [
        { name: "MediaFire (Solo con mando)", url: "https://www.mediafire.com/file/upcq6thmie0z9kg/HLM2_Suscribete_Crack%2521%2521%2521%2521%2521.apk/file" },
      ],
    },
  },
  {
    id: 12,
    title: "SUPER MEAT BOY",
    cover: "https://i.imgur.com/UJAZWBY.png",
    genres: ["AVENTURA"],
    platforms: ["PC", "ANDROID", "SWITCH"],
    downloads: {
      PC: [
        { name: "MediaFire", url: "https://www.mediafire.com/file/zsaptvd4ckvbzt7" },
        { name: "1fichier", url: "https://1fichier.com/?wuwivohl5wm7a8ded4yk" },
      ],
      ANDROID: [
        { name: "MediaFire", url: "https://www.mediafire.com/file/pzq9shzk0zrvy4w/Super+Meat+Boy+Forever+v6755.1849.1962.152+-+espacioapk.com.apk/file" },
      ],
      SWITCH: [
        { name: "Juego Base", url: "https://1fichier.com/?jimwe1yhcz5p7bizv2jk&af=1951572" },
        { name: "Actualizaciones", url: "https://1fichier.com/?smg44zmpq36x3o92yw93&af=1951572" },
      ],
    },
  },
  {
    id: 13,
    title: "BALDI'S BASICS IN EDUCATION AND LEARNING",
    cover: "https://i.imgur.com/kma8uJa.png",
    genres: ["AVENTURA"],
    platforms: ["PC", "ANDROID"],
    downloads: {
      PC: [
        { name: "MediaFire", url: "https://www.mediafire.com/file/yiq74na3k54turm" },
        { name: "Gofile", url: "https://gofile.io/d/D3d7h2" },
      ],
      ANDROID: [
        { name: "Itch.io", url: "https://baldifancuzwhynot6879.itch.io/bbcr-android-port" },
      ],
    },
  },
  {
    id: 14,
    title: "THE GHOST",
    cover: "https://i.imgur.com/OLJwUpo.png",
    genres: ["TERROR"],
    platforms: ["ANDROID"],
    downloads: {
      PLAY_STORE: [
        { name: "Play Store", url: "https://play.google.com/store/apps/details?id=com.Gameplier.TheGhost&pcampaignid=web_share" },
      ],
    },
  },
  {
    id: 15,
    title: "BALATRO",
    cover: "https://i.imgur.com/7VoQk4i.png",
    genres: ["ROGUE-LIKE"],
    platforms: ["PC", "ANDROID", "SWITCH"],
    downloads: {
      PC: [
        { name: "MediaFire", url: "https://www.mediafire.com/file/rnav2185crpfm21" },
      ],
      ANDROID: [
        { name: "Modcombo", url: "https://dlnew.gamestoremobi.com/Balatro-0.7-Mod-ModCombo.Com.apk" },
      ],
      SWITCH: [
        { name: "Juego Base", url: "https://1fichier.com/?og2tpa5awxlqervz2ps5&af=1951572" },
        { name: "Actualización", url: "https://1fichier.com/?s65biyfm5dj3wv2c7ssb&af=1951572" },
      ],
    },
  },
  {
    id: 16,
    title: "PSICOSIS",
    cover: "https://i.imgur.com/1Leu7He.png",
    genres: ["TERROR"],
    platforms: ["ANDROID"],
    downloads: {
      PLAY_STORE: [
        { name: "Play Store", url: "https://play.google.com/store/apps/details?id=com.SebastianOscarGomezBriceo.Psicosis&hl=es_419" },
      ],
    },
  },
  {
    id: 17,
    title: "GEOMETRY DASH",
    cover: "https://i.imgur.com/eR2MGLK.png",
    genres: ["RITMO", "PLATAFORMAS"],
    platforms: ["PC", "ANDROID"],
    downloads: {
      PC: [
        { name: "MediaFire", url: "https://www.mediafire.com/file/4oqkhsbyplv3ry0" },
        { name: "Gofile", url: "https://gofile.io/d/pfW2zy" },
      ],
      ANDROID: [
        { name: "Gofile", url: "https://gofile.io/d/S0T3fx" },
      ],
    },
  },
  {
    id: 18,
    title: "SOUL KNIGHT",
    cover: "https://i.imgur.com/placeholder.png",
    genres: ["AVENTURA", "ACCIÓN"],
    platforms: ["ANDROID"],
    downloads: {
      PLAY_STORE: [
        { name: "Play Store", url: "https://play.google.com/store/apps/details?id=com.ChillyRoom.DungeonShooter&pcampaignid=web_share" },
      ],
    },
  },
  {
    id: 19,
    title: "LIMBO",
    cover: "https://i.imgur.com/FpAJzSd.png",
    genres: ["TERROR", "AVENTURA"],
    platforms: ["PC", "ANDROID", "SWITCH"],
    downloads: {
      PC: [
        { name: "MediaFire", url: "https://www.mediafire.com/file/s3fp7njwviv7449" },
        { name: "Gofile", url: "https://gofile.io/d/5Eu7X0" },
      ],
      ANDROID: [
        { name: "MediaFire", url: "https://www.mediafire.com/file/f3v34a7b2uj3uj6" },
      ],
      SWITCH: [
        { name: "Juego Base", url: "https://1fichier.com/?2q8pq0uaeo704nwh2lhr&af=1951572" },
        { name: "Actualización", url: "https://1fichier.com/?eny21nkgh789vz5y40sg&af=1951572" },
      ],
    },
  },
  {
    id: 20,
    title: "TERRARIA",
    description: "Contraseña del archivo de PC: elenemigos.com",
    cover: "https://i.imgur.com/A9SdFq0.png",
    genres: ["AVENTURA"],
    platforms: ["PC", "ANDROID", "SWITCH"],
    downloads: {
      PC: [
        { name: "Fileq", url: "https://fileq.net/9fl90sxic6tq.html" },
        { name: "MediaFire", url: "https://www.mediafire.com/file/jz85e0jhp2epqg5/Terraria_b9965506_ElEnemigos.rar/file" },
      ],
      ANDROID: [
        { name: "Modyolo", url: "https://files.modyolo.com/Terraria/Terraria_%20v1.4.4.9.8%20_MOD.apk" },
      ],
      SWITCH: [
        { name: "Juego Base", url: "https://1fichier.com/?yygmrm1yecxe1oxleybz" },
        { name: "Actualización", url: "https://1fichier.com/?ldwm56681s77r6xq387k&af=1951572" },
      ],
    },
  },
  {
    id: 21,
    title: "HOLLOW KNIGHT",
    description: "Contraseña del archivo de PC: elenemigos.com",
    cover: "https://i.imgur.com/nbjlc7t.png",
    genres: ["AVENTURA", "ACCIÓN"],
    platforms: ["PC", "ANDROID", "SWITCH"],
    downloads: {
      PC: [
        { name: "Fileq", url: "https://fileq.net/0tfo7zgwbfe7.html" },
        { name: "MediaFire", url: "https://www.mediafire.com/file/zkbgrew9637a4ls/HollowK_ElEnemigos.rar/file" },
      ],
      ANDROID: [
        { name: "Drive", url: "https://drive.google.com/file/d/1XB4aIQj4MB-jLLgta-Pz55MBWSwucrCc/view" },
      ],
      SWITCH: [
        { name: "Juego Completo (XCI)", url: "https://1fichier.com/?k50hvxtyhyc9utrctppt?af=5006637" },
      ],
    },
  },
  {
    id: 22,
    title: "STARDEW VALLEY",
    description: "Contraseña del archivo de PC: elenemigos.com",
    cover: "https://i.imgur.com/NXHgtii.png",
    genres: ["AVENTURA"],
    platforms: ["PC", "ANDROID", "SWITCH"],
    downloads: {
      PC: [
        { name: "MediaFire", url: "https://www.mediafire.com/file/jz85e0jhp2epqg5/Terraria_b9965506_ElEnemigos.rar/file" },
        { name: "Fileq", url: "https://fileq.net/9fl90sxic6tq.html" },
      ],
      ANDROID: [
        { name: "Modyolo", url: "https://files.modyolo.com/Stardew%20Valley/stardew-valley%20v1.6.15.0.apk" },
      ],
      SWITCH: [
        { name: "Juego Base", url: "https://1fichier.com/?sw0q964nfrvadqz02qu9&af=1951572" },
        { name: "Actualización", url: "https://1fichier.com/?qmlaapqa56e05v35sk45&af=1951572" },
      ],
    },
  },
  {
    id: 23,
    title: "BEATBLOCK",
    cover: "https://i.imgur.com/qp1F3wb.png",
    genres: ["RITMO"],
    platforms: ["PC", "STEAM"],
    downloads: {
      DEMO: [
        { name: "Demo (Itch.io)", url: "https://bubbletabby.itch.io/beatblock" },
      ],
      STEAM: [
        { name: "Steam", url: "https://store.steampowered.com/app/3045200/Beatblock/" },
      ],
    },
  },
  {
    id: 24,
    title: "MUSE DASH",
    description: "Contraseña del archivo de PC: elenemigos.com",
    cover: "https://i.imgur.com/eU14Qc4.png",
    genres: ["RITMO"],
    platforms: ["SWITCH", "PC", "ANDROID"],
    downloads: {
      SWITCH: [
        { name: "Juego Base", url: "https://1fichier.com/?zenp3xfc0ki798rjeb6o" },
        { name: "DLC's", url: "https://1fichier.com/?ff161kgzc0jrtr5jo6ej&af=1951572" },
        { name: "Actualizaciones", url: "https://1fichier.com/?kjfh4wb5ooypvicl8uh5&af=1951572" },
      ],
      PC: [
        { name: "Akirabox", url: "https://akirabox.to/downloads" },
      ],
      ANDROID: [
        { name: "Modyolo", url: "https://files.modyolo.com/Muse%20Dash/Muse_Dash_%20v5.10.1%20_MOD.xapk" },
      ],
    },
  },
  {
    id: 25,
    title: "VIB-RIBBON",
    cover: "https://i.imgur.com/xBdYr6U.png",
    genres: ["RITMO"],
    platforms: ["PS1"],
    downloads: {
      PS2: [
        { name: "Romsfun", url: "https://sto1.romsforever.co/0:/PSX-CHD/Vib-Ribbon%20(Europe)%20(EnFrDeEsIt).chd?token=cH1ZalNgXU9HEG91XnYdYV9XQxlxfV59VQ%3D%3D" },
      ],
    },
  },
  {
    id: 26,
    title: "CADENCE OF HYRULE",
    cover: "https://i.imgur.com/RG3q3Q7.png",
    genres: ["RITMO"],
    platforms: ["SWITCH"],
    downloads: {
      SWITCH: [
        { name: "Juego Base", url: "https://1fichier.com/?7i61t9mxh583unxhuu3o" },
        { name: "DLC's", url: "https://1fichier.com/?2inyrr94fvnj4zq1gblv" },
        { name: "Actualizaciones", url: "https://1fichier.com/?vywt5vfuc8eq4zjp43hx" },
      ],
    },
  },
  {
    id: 27,
    title: "RHYTHM HEAVEN WII",
    cover: "https://i.imgur.com/73sMNbm.png",
    genres: ["RITMO"],
    platforms: ["WII"],
    downloads: {
      WII: [
        { name: "Romsfun", url: "https://sto.romsfast.com/Wii/Rhythm%20Heaven%20Fever%20(USA).zip?token=cH1ZalNgXU9HEG91XnYdYV9XQxlxfVxyUw%3D%3D" },
      ],
    },
  },
  {
    id: 28,
    title: "PATAPON",
    cover: "https://i.imgur.com/5it63aC.png",
    genres: ["RITMO", "AVENTURA"],
    platforms: ["PC", "SWITCH"],
    downloads: {
      PC: [
        { name: "Fileq", url: "https://fileq.net/pqq4tqb5quue.html" },
      ],
      SWITCH: [
        { name: "Juego Base", url: "https://1fichier.com/?oac22tnnzht4jfxqv3ik&af=1951572" },
        { name: "Actualización", url: "https://1fichier.com/?10tutqix29enwveprh7j&af=1951572" },
      ],
    },
  },
  {
    id: 29,
    title: "REZ INFINITE",
    cover: "https://i.imgur.com/SjcqWqE.png",
    genres: ["RITMO", "DISPAROS"],
    platforms: ["PC", "PS2"],
    downloads: {
      PC: [
        { name: "TORRENT (No probado)", url: "https://skidrowrepack.com/index.php?do=download&id=10448" },
      ],
      PS2: [
        { name: "MediaFire (Versión segura)", url: "https://www.mediafire.com/file/nl3b4xw1kx153du" },
      ],
    },
  },
  {
    id: 30,
    title: "CLONE HERO",
    cover: "https://i.imgur.com/t9mECjY.png",
    genres: ["RITMO"],
    platforms: ["PC"],
    downloads: {
      OFICIAL: [
        { name: "Oficial", url: "https://github.com/clonehero-game/releases/releases/download/V1.0.0.4080/CloneHero-win64.exe" },
      ],
    },
  },
  {
    id: 31,
    title: "CRYPT OF THE NECRODANCER",
    cover: "https://i.imgur.com/placeholder.png",
    genres: ["RITMO", "AVENTURA"],
    platforms: ["PC", "ANDROID", "SWITCH"],
    downloads: {
      PC: [
        { name: "UploadHeaven", url: "https://uploadhaven.com/download/d8b6395adcba62d9c0313dd998ebf496" },
      ],
      ANDROID: [
        { name: "Modyolo", url: "https://files.modyolo.com/Crypt%20of%20the%20NecroDancer/CryptOfTheNecroDancer_1.2.3_Full.apk" },
      ],
      SWITCH: [
        { name: "Juego Base", url: "https://1fichier.com/?7eoourcmrx6zrwk4lxk1&af=1951572" },
        { name: "DLC's", url: "https://1fichier.com/?q98hbwa34vy1zdpz0h55&af=1951572" },
        { name: "Actualizaciones", url: "https://1fichier.com/?mq1sgz5rxdt2228dd5hu&af=1951572" },
      ],
    },
  },
  {
    id: 32,
    title: "HI-FI RUSH",
    cover: "https://i.imgur.com/placeholder.png",
    genres: ["RITMO", "ACCIÓN", "AVENTURA"],
    platforms: ["PC"],
    downloads: {
      PC: [
        { name: "Fileq", url: "https://fileq.net/8w5g2gnyri85.html" },
      ],
    },
  },
  {
    id: 33,
    title: "A DANCE OF FIRE AND ICE",
    cover: "https://i.imgur.com/placeholder.png",
    genres: ["RITMO"],
    platforms: ["PC", "ANDROID"],
    downloads: {
      PC: [
        { name: "Fileq", url: "https://fileq.net/naf1qhktv9l8.html" },
      ],
      ANDROID: [
        { name: "Modyolo", url: "https://files.modyolo.com/A%20Dance%20of%20Fire%20and%20Ice/A_Dance_of_Fire_and_Ice%20v2.9.9.apk" },
      ],
    },
  },
  {
    id: 34,
    title: "OSU!",
    cover: "https://i.imgur.com/placeholder.png",
    genres: ["RITMO", "ACCIÓN"],
    platforms: ["PC", "ANDROID"],
    downloads: {
      OFICIAL: [
        { name: "Oficial PC", url: "https://github.com/ppy/osu/releases/latest/download/install.exe" },
        { name: "Oficial Android", url: "https://github.com/ppy/osu/releases/latest/download/sh.ppy.osulazer.apk" },
      ],
    },
  },
];
