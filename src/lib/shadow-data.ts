export const ARTIST = "SLPlayer Project" as const;

export type Track = {
  id: string;
  index: string;
  title: string;
  duration: string;
  filename?: string;
  endTime?: number;
};

export type Gate = {
  id: string;
  name: string;
  rank: string;
  code: string;
  tracks: Track[];
};

// Gates are empty shells — tracks assigned dynamically via the Unassigned Essence panel
export const GATES: Gate[] = [
  {
    id: "boss",
    name: "BOSS THEMES",
    rank: "S-RANK",
    code: "GT-001",
    tracks: [],
  },
  {
    id: "hype",
    name: "SHADOW HYPE",
    rank: "A-RANK",
    code: "GT-002",
    tracks: [],
  },
  {
    id: "chill",
    name: "CHILL VOID",
    rank: "B-RANK",
    code: "GT-003",
    tracks: [],
  },
  {
    id: "monarch",
    name: "MONARCH'S DOMAIN",
    rank: "S-RANK",
    code: "GT-004",
    tracks: [],
  },
  {
    id: "dungeon",
    name: "DUNGEON RUN",
    rank: "C-RANK",
    code: "GT-005",
    tracks: [],
  },
  { id: "awaken", name: "AWAKENING", rank: "??", code: "GT-006", tracks: [] },
];

export const NEW_UNASSIGNED_TRACKS: Track[] = [
  {
    "id": "tiki-tiki-slowed",
    "index": "??",
    "title": "TIKI TIKI (Slowed)",
    "duration": "2:01",
    "filename": "tiki_tiki_slowed.m4a",
    "endTime": 121
  },
  {
    "id": "veki-veki-slowed",
    "index": "??",
    "title": "VEKI VEKI (Ultra Slowed)",
    "duration": "1:55",
    "filename": "veki_veki_ultra_slowed.m4a",
    "endTime": 115
  },
  {
    "id": "worry-slowed",
    "index": "??",
    "title": "worry (ultra slowed)",
    "duration": "4:15",
    "filename": "worry_ultra_slowed.m4a",
    "endTime": 255
  },
  {
    "id": "babydoll-perfect-girl",
    "index": "??",
    "title": "Babydoll X The Perfect Girl (Full Version)",
    "duration": "2:14",
    "filename": "babydoll_the_perfect_girl.m4a",
    "endTime": 134
  },
  {
    "id": "one-of-the-girls-mashup",
    "index": "??",
    "title": "One Of The Girls X Good For You (Mashup)",
    "duration": "4:05",
    "filename": "one_of_the_girls_good_for_you.m4a",
    "endTime": 245
  },
  {
    "id": "dress-over-slowed-reverb",
    "index": "??",
    "title": "DRESS! (Over Slowed + Reverb)",
    "duration": "2:00",
    "filename": "DRESS_Over_Slowed_+_Reverb.m4a",
    "endTime": 120
  },
  {
    "id": "eternxlkz-slay-official-audio",
    "index": "??",
    "title": "Eternxlkz - SLAY! (Official Audio)",
    "duration": "1:42",
    "filename": "Eternxlkz_-_SLAY_Official_Audio.m4a",
    "endTime": 102
  },
  {
    "id": "lxngvx-bruxo-fantasma-super-slowed",
    "index": "??",
    "title": "LXNGVX - BRUXO FANTASMA (Super Slowed)",
    "duration": "1:53",
    "filename": "LXNGVX_-_BRUXO_FANTASMA_Super_Slowed.m4a",
    "endTime": 113
  },
  {
    "id": "wutiwant-slowed",
    "index": "??",
    "title": "wutiwant (Slowed)",
    "duration": "2:45",
    "filename": "wutiwant_Slowed.m4a",
    "endTime": 165
  },
  {
    "id": "bloody-ultra-slowed",
    "index": "??",
    "title": "BLOODY! (ULTRA SLOWED)",
    "duration": "2:12",
    "filename": "BLOODY_ULTRA_SLOWED.m4a",
    "endTime": 132
  },
  {
    "id": "ogryzek-glory-super-slowed-reverb-official-visualiser",
    "index": "??",
    "title": "Ogryzek - GLORY Super Slowed + Reverb (Official Visualiser)",
    "duration": "3:12",
    "filename": "Ogryzek_-_GLORY_Super_Slowed_+_Reverb_Official_Visualiser.m4a",
    "endTime": 192
  },
  {
    "id": "automotivo-pa-pa-papai-slowed-dj-rio",
    "index": "??",
    "title": "AUTOMOTIVO PA PA PAPAI (Slowed) - DJ RIO",
    "duration": "1:10",
    "filename": "AUTOMOTIVO_PA_PA_PAPAI_Slowed_-_DJ_RIO.m4a",
    "endTime": 70
  },
  {
    "id": "montagem-fim-estrelar-super-slowed",
    "index": "??",
    "title": "MONTAGEM FIM ESTRELAR (SUPER SLOWED)",
    "duration": "4:36",
    "filename": "MONTAGEM_FIM_ESTRELAR_SUPER_SLOWED.m4a",
    "endTime": 276
  },
  {
    "id": "nxght-scythermane-nunca-muda-brazilian-phonk",
    "index": "??",
    "title": "NXGHT, Scythermane - NUNCA MUDA? ( )",
    "duration": "1:21",
    "filename": "NXGHT_Scythermane_-_NUNCA_MUDA_brazilian_phonk.m4a",
    "endTime": 81
  },
  {
    "id": "automotivo-catucada-1-0-super-slowed",
    "index": "??",
    "title": "Automotivo Catucada 1.0 (Super Slowed)",
    "duration": "1:46",
    "filename": "Automotivo_Catucada_1.0_Super_Slowed.m4a",
    "endTime": 106
  },
  {
    "id": "montagem-diamante-rosa-slowed",
    "index": "??",
    "title": "MONTAGEM DIAMANTE ROSA (SLOWED)",
    "duration": "1:55",
    "filename": "MONTAGEM_DIAMANTE_ROSA_SLOWED.m4a",
    "endTime": 115
  },
  {
    "id": "automotivo-da-zona-sul-4-super-slowed",
    "index": "??",
    "title": "Automotivo da Zona Sul 4 (Super Slowed)",
    "duration": "3:14",
    "filename": "Automotivo_da_Zona_Sul_4_Super_Slowed.m4a",
    "endTime": 194
  },
  {
    "id": "georgianfolk-acharuli-gandagana-trap-remix-edit",
    "index": "??",
    "title": "@GeorgianFolk Acharuli Gandagana (Trap Remix Edit)",
    "duration": "2:45",
    "filename": "@GeorgianFolk_Acharuli_Gandagana_Trap_Remix_Edit.m4a",
    "endTime": 165
  },
  {
    "id": "yugoslavskiy-groove-slowed-reverb",
    "index": "??",
    "title": "Yugoslavskiy Groove (Slowed + Reverb)",
    "duration": "1:07",
    "filename": "Yugoslavskiy_Groove_Slowed_+_Reverb.m4a",
    "endTime": 67
  },
  {
    "id": "atlxs-passo-bem-solto-slowed",
    "index": "??",
    "title": "ATLXS - PASSO BEM SOLTO (SLOWED)",
    "duration": "1:56",
    "filename": "ATLXS_-_PASSO_BEM_SOLTO_SLOWED.m4a",
    "endTime": 116
  },
  {
    "id": "funk-oscuro-ultra-slowed",
    "index": "??",
    "title": "FUNK OSCURO (Ultra Slowed)",
    "duration": "2:34",
    "filename": "FUNK_OSCURO_Ultra_Slowed.m4a",
    "endTime": 154
  },
  {
    "id": "montagem-tomada-slowed",
    "index": "??",
    "title": "MONTAGEM TOMADA SLOWED",
    "duration": "1:25",
    "filename": "MONTAGEM_TOMADA_SLOWED.m4a",
    "endTime": 85
  },
  {
    "id": "acido-slowed",
    "index": "??",
    "title": "ACIDO (Slowed)",
    "duration": "1:25",
    "filename": "ACIDO_Slowed.m4a",
    "endTime": 85
  },
  {
    "id": "espaco-liminal-slowed",
    "index": "??",
    "title": "ESPACO LIMINAL SLOWED",
    "duration": "2:08",
    "filename": "ESPACO_LIMINAL_SLOWED.m4a",
    "endTime": 128
  },
  {
    "id": "slxughter-fragment-slowed",
    "index": "??",
    "title": "slxughter - fragment (slowed)",
    "duration": "1:37",
    "filename": "slxughter_-_fragment_slowed.m4a",
    "endTime": 97
  },
  {
    "id": "esse-cara-super-slowed",
    "index": "??",
    "title": "ESSE CARA! (Super Slowed)",
    "duration": "1:20",
    "filename": "ESSE_CARA_Super_Slowed.m4a",
    "endTime": 80
  },
  {
    "id": "ariis-yb-wasg-ood-luna-bala-ultra-slowed",
    "index": "??",
    "title": "Ariis, Yb Wasg'ood - LUNA BALA (Ultra Slowed)",
    "duration": "2:18",
    "filename": "Ariis_Yb_Wasg_ood_-_LUNA_BALA_Ultra_Slowed.m4a",
    "endTime": 138
  },
  {
    "id": "funk-mi-camino",
    "index": "??",
    "title": "FUNK MI CAMINO",
    "duration": "1:20",
    "filename": "FUNK_MI_CAMINO.m4a",
    "endTime": 80
  },
  {
    "id": "deprezz-i-ll-do-it-slowed",
    "index": "??",
    "title": "deprezz - I'll Do It (Slowed)",
    "duration": "4:26",
    "filename": "deprezz_-_I_ll_Do_It_Slowed.m4a",
    "endTime": 266
  },
  {
    "id": "funk-sigilo-slowed",
    "index": "??",
    "title": "FUNK SIGILO (SLOWED)",
    "duration": "1:43",
    "filename": "FUNK_SIGILO_SLOWED.m4a",
    "endTime": 103
  },
  {
    "id": "pinky-smash-lost-astronaut-slowed",
    "index": "??",
    "title": "PINKY SMASH - LOST ASTRONAUT (SLOWED)",
    "duration": "3:03",
    "filename": "PINKY_SMASH_-_LOST_ASTRONAUT_SLOWED.m4a",
    "endTime": 183
  },
  {
    "id": "kobe-mane-violento-slowed",
    "index": "??",
    "title": "Kobe Mane - VIOLENTO (Slowed)",
    "duration": "1:39",
    "filename": "Kobe_Mane_-_VIOLENTO_Slowed.m4a",
    "endTime": 99
  },
  {
    "id": "x-slide-ultra-slowed",
    "index": "??",
    "title": "X-SLIDE (Ultra Slowed)",
    "duration": "2:06",
    "filename": "X-SLIDE_Ultra_Slowed.m4a",
    "endTime": 126
  },
  {
    "id": "aurea-cosmica-japanese-version-super-slowed",
    "index": "??",
    "title": "Áurea cósmica (Japanese Version [Super Slowed])",
    "duration": "3:12",
    "filename": "Aurea_cosmica_Japanese_Version_Super_Slowed.m4a",
    "endTime": 192
  },
  {
    "id": "isq-hypnotic-super-slowed",
    "index": "??",
    "title": "isq - hypnotic (super slowed)",
    "duration": "2:01",
    "filename": "isq_-_hypnotic_super_slowed.m4a",
    "endTime": 121
  },
  {
    "id": "6ynthmane-lxghtxng-fina-lana-official-video",
    "index": "??",
    "title": "6YNTHMANE, LXGHTXNG - FINA LANA (Official Video)",
    "duration": "1:17",
    "filename": "6YNTHMANE_LXGHTXNG_-_FINA_LANA_Official_Video.m4a",
    "endTime": 77
  },
  {
    "id": "tokyophile-montagem-lunar-celestia-1-0-slowed",
    "index": "??",
    "title": "TOKYOPHILE - Montagem Lunar Celestia 1.0 (Slowed)",
    "duration": "1:36",
    "filename": "TOKYOPHILE_-_Montagem_Lunar_Celestia_1.0_Slowed.m4a",
    "endTime": 96
  },
  {
    "id": "canto-de-luna-super-slowed",
    "index": "??",
    "title": "CANTO DE LUNA (SUPER SLOWED)",
    "duration": "1:49",
    "filename": "CANTO_DE_LUNA_SUPER_SLOWED.m4a",
    "endTime": 109
  },
  {
    "id": "zxkai-slxughter-no-batidao-slowed-reverb",
    "index": "??",
    "title": "ZXKAI, slxughter - NO BATIDÃO (Slowed + Reverb)",
    "duration": "1:48",
    "filename": "ZXKAI_slxughter_-_NO_BATIDAO_Slowed_+_Reverb.m4a",
    "endTime": 108
  },
  {
    "id": "montagem-alucinante-super-slowed",
    "index": "??",
    "title": "MONTAGEM ALUCINANTE (SUPER SLOWED)",
    "duration": "3:47",
    "filename": "MONTAGEM_ALUCINANTE_SUPER_SLOWED.m4a",
    "endTime": 227
  },
  {
    "id": "bxkq-pxlwyse-te-conoci-super-slowed-official-audio",
    "index": "??",
    "title": "bxkq, PXLWYSE - TE CONOCÍ - Super Slowed (Official Audio)",
    "duration": "2:31",
    "filename": "bxkq_PXLWYSE_-_TE_CONOCI_-_Super_Slowed_Official_Audio.m4a",
    "endTime": 151
  },
  {
    "id": "andromeda-montagem-coma-ultra-slowed",
    "index": "??",
    "title": "ANDROMEDA - MONTAGEM COMA (Ultra Slowed)",
    "duration": "1:39",
    "filename": "ANDROMEDA_-_MONTAGEM_COMA_Ultra_Slowed.m4a",
    "endTime": 99
  },
  {
    "id": "eternxlkz-sente-mais-super-slowed-reverb",
    "index": "??",
    "title": "Eternxlkz - SENTE MAIS (Super Slowed & Reverb)",
    "duration": "2:43",
    "filename": "Eternxlkz_-_SENTE_MAIS_Super_Slowed_Reverb.m4a",
    "endTime": 163
  },
  {
    "id": "mgd-khangmxne-2-phut-hon-funk-super-slowed-reverb",
    "index": "??",
    "title": "MGD & KhangMxne - 2 Phut hon Funk (  + )",
    "duration": "3:04",
    "filename": "MGD_KhangMxne_-_2_Phut_hon_Funk_Super_Slowed_+_Reverb.m4a",
    "endTime": 184
  },
  {
    "id": "malvado-de-vapo-slowed",
    "index": "??",
    "title": "MALVADO DE VAPO (Slowed)",
    "duration": "1:23",
    "filename": "MALVADO_DE_VAPO_Slowed.m4a",
    "endTime": 83
  },
  {
    "id": "voce-na-mira-jumpstyle-slowed",
    "index": "??",
    "title": "VOCE NA MIRA JUMPSTYLE (Slowed)",
    "duration": "2:42",
    "filename": "VOCE_NA_MIRA_JUMPSTYLE_Slowed.m4a",
    "endTime": 162
  },
  {
    "id": "mazko-slowed",
    "index": "??",
    "title": "MAZKO (Slowed)",
    "duration": "1:24",
    "filename": "MAZKO_Slowed.m4a",
    "endTime": 84
  },
  {
    "id": "red-sex-restrung-best-part-extended-slowed-reverb-shortened",
    "index": "??",
    "title": "Red Sex restrung best part extended Slowed+Reverb (shortened)",
    "duration": "1:06",
    "filename": "Red_Sex_restrung_best_part_extended_Slowed+Reverb_shortened.m4a",
    "endTime": 66
  },
  {
    "id": "you-look-lonely-i-can-fix-that-x-softcore-slowed-reverb",
    "index": "??",
    "title": "You look lonely I can fix that x Softcore (slowed & reverb)",
    "duration": "3:36",
    "filename": "You_look_lonely_I_can_fix_that_x_Softcore_slowed_reverb.m4a",
    "endTime": 216
  },
  {
    "id": "stacks-from-all-sides",
    "index": "??",
    "title": "(Stacks from All Sides)",
    "duration": "2:53",
    "filename": "Stacks_from_All_Sides.m4a",
    "endTime": 173
  },
  {
    "id": "artemas-i-like-the-way-you-kiss-me-slowed-reverb",
    "index": "??",
    "title": "Artemas- i like the way you kiss me (slowed + reverb)",
    "duration": "2:58",
    "filename": "Artemas-_i_like_the_way_you_kiss_me_slowed_+_reverb.m4a",
    "endTime": 178
  },
  {
    "id": "britney-spears-gimme-more-lyrics",
    "index": "??",
    "title": "Britney Spears - Gimme More (Lyrics)",
    "duration": "4:09",
    "filename": "Britney_Spears_-_Gimme_More_Lyrics.m4a",
    "endTime": 249
  },
  {
    "id": "the-weeknd-sao-paulo-lyrics-feat-anitta",
    "index": "??",
    "title": "The Weeknd - São Paulo (Lyrics) feat. Anitta",
    "duration": "5:01",
    "filename": "The_Weeknd_-_Sao_Paulo_Lyrics_feat._Anitta.m4a",
    "endTime": 301
  },
  {
    "id": "imogen-heap-headlock-lyrics",
    "index": "??",
    "title": "Imogen Heap - Headlock (Lyrics)",
    "duration": "3:30",
    "filename": "Imogen_Heap_-_Headlock_Lyrics.m4a",
    "endTime": 210
  },
  {
    "id": "i-could-be",
    "index": "??",
    "title": "I Could Be",
    "duration": "2:00",
    "filename": "I_Could_Be.m4a",
    "endTime": 120
  },
  {
    "id": "blackbear-hot-girl-bummer-slowed-reverb",
    "index": "??",
    "title": "blackbear - hot girl bummer (slowed + reverb)",
    "duration": "3:32",
    "filename": "blackbear_-_hot_girl_bummer_slowed_+_reverb.m4a",
    "endTime": 212
  },
  {
    "id": "lana-del-rey-brooklyn-baby-yeah-my-boyfriend-s-pretty-cool-part-slowed-looped",
    "index": "??",
    "title": "lana del rey - brooklyn baby \"yeah my boyfriend's pretty cool\" part [slowed + looped]",
    "duration": "4:46",
    "filename": "lana_del_rey_-_brooklyn_baby_yeah_my_boyfriend_s_pretty_cool_part_slowed_+_looped.m4a",
    "endTime": 286
  },
  {
    "id": "lana-del-rey-summertime-sadness-official-music-video",
    "index": "??",
    "title": "Lana Del Rey - Summertime Sadness (Official Music Video)",
    "duration": "4:25",
    "filename": "Lana_Del_Rey_-_Summertime_Sadness_Official_Music_Video.m4a",
    "endTime": 265
  },
  {
    "id": "lana-del-rey-say-yes-to-heaven-official-audio",
    "index": "??",
    "title": "Lana Del Rey - Say Yes To Heaven (Official Audio)",
    "duration": "3:29",
    "filename": "Lana_Del_Rey_-_Say_Yes_To_Heaven_Official_Audio.m4a",
    "endTime": 209
  },
  {
    "id": "sexy-back-slowed",
    "index": "??",
    "title": "Sexy Back - Justin Timberlake ( Slowed to Perfection + Reverb ) Toji / Rose Tracks /",
    "duration": "4:35",
    "filename": "sexy_back_slowed.m4a",
    "endTime": 275
  },
  {
    "id": "riserayss-lonown-jessie-slowed-reverb",
    "index": "??",
    "title": "riserayss • LONOWN — jessie (slowed + reverb)",
    "duration": "4:40",
    "filename": "riserayss_LONOWN_jessie_slowed_+_reverb.m4a",
    "endTime": 280
  },
  {
    "id": "acido-iii-super-slowed",
    "index": "??",
    "title": "ACIDO III (SUPER SLOWED)",
    "duration": "1:48",
    "filename": "ACIDO_III_SUPER_SLOWED.m4a",
    "endTime": 108
  },
  {
    "id": "bye-altare-remix-ariana-grande-slowed-reverb",
    "index": "??",
    "title": "bye (Altare remix) - Ariana Grande (slowed + reverb)",
    "duration": "3:31",
    "filename": "bye_Altare_remix_-_Ariana_Grande_slowed_+_reverb.m4a",
    "endTime": 211
  },
  {
    "id": "bia-a-ap-ferg-we-on-go-ii-official-audio-ft-denzel-curry",
    "index": "??",
    "title": "BIA, A$AP Ferg - WE ON GO II (Official Audio) ft. Denzel Curry",
    "duration": "3:17",
    "filename": "BIA_A_AP_Ferg_-_WE_ON_GO_II_Official_Audio_ft._Denzel_Curry.m4a",
    "endTime": 197
  },
  {
    "id": "push-the-feeling-on-slowed-reverb",
    "index": "??",
    "title": "Push The Feeling On (Slowed+Reverb)",
    "duration": "4:34",
    "filename": "Push_The_Feeling_On_Slowed+Reverb.m4a",
    "endTime": 274
  },
  {
    "id": "conflate",
    "index": "??",
    "title": "Conflate",
    "duration": "2:28",
    "filename": "Conflate.m4a",
    "endTime": 148
  },
  {
    "id": "the-weeknd-sao-paulo-official-audio",
    "index": "??",
    "title": "The Weeknd - São Paulo (Official Audio)",
    "duration": "5:02",
    "filename": "The_Weeknd_-_Sao_Paulo_Official_Audio.m4a",
    "endTime": 302
  },
  {
    "id": "tame-impala-dracula-official-video",
    "index": "??",
    "title": "Tame Impala - Dracula (Official Video)",
    "duration": "3:53",
    "filename": "Tame_Impala_-_Dracula_Official_Video.m4a",
    "endTime": 233
  }
];
