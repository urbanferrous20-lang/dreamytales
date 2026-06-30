import { randomInt } from "crypto";

/**
 * Curated story traditions — mood, structure, and emotional beats from beloved
 * children's books and family-friendly films. Prompts use "spirit only" language;
 * the model must never copy titles, characters, lyrics, or plots.
 */
export type StoryInspiration = {
  key: string;
  /** Internal label for dedup — classic tradition, not a retelling target */
  tradition: string;
  /** What to borrow: feeling, structure, or story shape */
  motif: string;
};

export const STORY_INSPIRATION_LIBRARY: StoryInspiration[] = [
  // Picture-book wonder & return home
  { key: "wild_imagination_return", tradition: "Where the Wild Things Are", motif: "Big feelings become a wild adventure, then calm return to a warm, safe home and supper waiting." },
  { key: "goodnight_ritual", tradition: "Goodnight Moon", motif: "Slow goodnight to familiar room objects — lamp, moon, socks — each page softer than the last." },
  { key: "harold_purple_path", tradition: "Harold and the Purple Crayon", motif: "A child draws their own path through the night — simple lines become moon, boat, and safe bed." },
  { key: "very_hungry_journey", tradition: "The Very Hungry Caterpillar", motif: "Small bites of wonder each step — gentle growth, transformation, satisfied sleepy ending." },
  { key: "snowy_day_rediscovery", tradition: "The Snowy Day", motif: "Ordinary neighbourhood made magical by snow — footprints, quiet, pink sky, memory kept in pocket." },
  { key: "gruffalo_clever_small", tradition: "The Gruffalo", motif: "Small hero uses wit (not force) to walk through scary woods — fear becomes funny." },
  { key: "room_on_broom_team", tradition: "Room on the Broom", motif: "Unlikely friends share one broom — each helps, storm passes, together stronger." },
  { key: "velveteen_real", tradition: "The Velveteen Rabbit", motif: "Well-loved toy worn soft — love makes something feel real and treasured." },
  { key: "corduroy_belonging", tradition: "Corduroy", motif: "Lost button, small fix, finding where you belong — department store night adventure." },
  { key: "rainbow_fish_share", tradition: "The Rainbow Fish", motif: "Something shiny shared — loneliness becomes friendship when you give a scale away." },
  { key: "gives_moon_love", tradition: "Guess How Much I Love You", motif: "Competition of love between child and caregiver — moon wins, hug ends the day." },
  { key: "quiet_loud_contrast", tradition: "The Quiet Book / The Loud Book", motif: "Play with opposites — whisper moments vs burst of giggles, all gentle." },
  { key: "press_here_play", tradition: "Press Here", motif: "Reader and page play together — dots, colours, cause-and-effect magic without leaving bed." },
  { key: "kapow_pigeon_delay", tradition: "Don't Let the Pigeon Stay Up Late", motif: "Silly negotiation at bedtime — child is the wise one who knows it's sleep time." },
  { key: "bear_snores_on", tradition: "Bear Snores On", motif: "Cozy cave fills with friends while bear sleeps — warmth, sharing soup, no one left out." },
  { key: "kitten_moon_mistake", tradition: "Kitten's First Full Moon", motif: "Mistaken quest for a bowl of milk — persistence, moonlight, sweet resolution." },
  { key: "lost_found_penguin", tradition: "Lost and Found", motif: "Small companion appears — journey to return them, friendship was the point." },
  { key: "paper_bag_princess", tradition: "The Paper Bag Princess", motif: "Resourceful hero saves the day with brains — crown optional, courage required." },
  { key: "giant_jam_sandwich", tradition: "The Giant Jam Sandwich", motif: "Village solves a problem together — absurd teamwork, wasps defeated with bread." },
  { key: "tiger_came_tea", tradition: "The Tiger Who Came to Tea", motif: "Unexpected guest eats everything — chaos, then takeaway and tomorrow's grocery." },

  // Fairy tale & folk structures (public-domain shapes)
  { key: "three_wishes_careful", tradition: "Three wishes folk tale", motif: "Three small magical chances — wish wisely, third wish fixes the silly first two." },
  { key: "kind_stranger_reward", tradition: "Kindness rewarded", motif: "Help a humble stranger — magic repays generosity, meanness gets comic comeuppance." },
  { key: "magic_midnight_end", tradition: "Cinderella clock", motif: "Magic lasts until a bell — one shoe, one clue, home before dreams fade." },
  { key: "three_bears_just_right", tradition: "Goldilocks", motif: "Try three sizes — porridge, chair, bed — find what's 'just right', leave gently." },
  { key: "wolf_huff_puff", tradition: "Three Little Pigs", motif: "Build with care — straw, sticks, bricks; huffing worry passes, house stands." },
  { key: "beanstalk_up_down", tradition: "Jack and the Beanstalk", motif: "Climb to impossible sky — take only what's needed, climb down before giant stirs." },
  { key: "red_hood_path", tradition: "Little Red Riding Hood (gentle)", motif: "Forest path with basket — trust instincts, wolf is worry not horror, grandmother safe." },
  { key: "sleeping_hundred", tradition: "Sleeping Beauty / Briar Rose", motif: "Kingdom paused in roses — one brave kindness wakes spring, not a kiss unless kind." },
  { key: "mermaid_trade_voice", tradition: "Little Mermaid (gentle)", motif: "Trade something precious for a wish — learn what matters, voice returns with love." },
  { key: "beauty_sees_inner", tradition: "Beauty and the Beast (gentle)", motif: "Frightening outside, gentle inside — library, rose, winter garden, kindness breaks spell." },
  { key: "shoemaker_elves", tradition: "The Elves and the Shoemaker", motif: "Secret helpers finish work at night — leave thank-you gifts, magic moves on." },
  { key: "emperor_new_clothes", tradition: "Emperor's New Clothes", motif: "Child speaks plain truth — parade of pretence pops, laughter not cruelty." },
  { key: "stone_soup_share", tradition: "Stone Soup", motif: "Empty pot, one stone — neighbours add bit by bit until feast feeds everyone." },
  { key: "hen_bakes_alone", tradition: "Little Red Hen", motif: "Work alone or help together — bread smells best when shared at the end." },

  // Adventure & chapter-book energy (age-appropriate)
  { key: "wardrobe_other_world", tradition: "Narnia wardrobe", motif: "Ordinary door to snow forest — lamppost, faun tea, return when heart full." },
  { key: "oz_yellow_friends", tradition: "Wizard of Oz", motif: "Three odd friends on a road — courage, heart, brains were inside all along." },
  { key: "neverland_fly_bed", tradition: "Peter Pan (gentle)", motif: "Fly over rooftops — second star, lost shadow found, tick-tock far away, bed wins." },
  { key: "wind_willow_river", tradition: "Wind in the Willows", motif: "River picnic, motor car scare, home is burrow with firelight." },
  { key: "secret_garden_key", tradition: "The Secret Garden", motif: "Key to walled garden — winter branches turn green with patience and whisper." },
  { key: "charlotte_web_friend", tradition: "Charlotte's Web", motif: "Small pig, clever friend in corner — words in web save day, seasons turn gently." },
  { key: "matilda_small_power", tradition: "Matilda (gentle)", motif: "Quiet child with inner spark — books as friends, small magic for bullies not revenge." },
  { key: "bfg_dreams", tradition: "The BFG", motif: "Giant who collects dreams — jar of good dream blown through window." },
  { key: "james_peach_family", tradition: "James and the Giant Peach", motif: "Giant fruit rolls — misfit insects become family, ocean crossed on pit." },
  { key: "phantom_tollbooth", tradition: "Phantom Tollbooth", motif: "Bored child drives into word-play land — letters, numbers, rhyme bridge home." },
  { key: "pooh_honey_quest", tradition: "Winnie-the-Pooh", motif: "Small quest for honey — heffalump might be imaginary, friends matter most." },
  { key: "paddington_marmalade", motif: "Bear from far away with suitcase — polite chaos, marmalade, family adopts stranger.", tradition: "Paddington" },
  { key: "toy_museum_night", tradition: "Toy museum night", motif: "When lights dim, exhibits whisper — child guest of honour, dawn returns still." },

  // Animated-film STORY SHAPES (no character names in output)
  { key: "toys_awake_secret", tradition: "Toy inner life films", motif: "When humans sleep, toys have meetings — loyalty, belonging, return to shelf before dawn." },
  { key: "fish_ocean_cross", tradition: "Finding-family ocean journey", motif: "Small fin crosses reef — helpers along way, reunion hug in calm cove." },
  { key: "feelings_teamwork", tradition: "Feelings-as-friends films", motif: "Joy, worry, and anger personified — learn they all belong, console panel harmonises." },
  { key: "robot_learns_love", tradition: "Robot learns heart", motif: "Metal hands learn gentleness — one plant, one friend, sky full of stars." },
  { key: "ice_thaw_sister", tradition: "Sisterly thaw story", motif: "Winter magic from fear — act of love melts wall, summer returns to fjord." },
  { key: "beast_library_winter", tradition: "Enchanted castle winter", motif: "Snow castle, enchanted servants, library duet — spell breaks with kindness." },
  { key: "lantern_floating_wish", tradition: "Floating lantern wish", motif: "Thousands of lights on water — one wish released, parent and child see same sky." },
  { key: "car_radiator_springs", tradition: "Small town pit stop", motif: "Fast hero slows down — desert town teaches route matters less than friends." },
  { key: "house_balloon_flight", tradition: "House with balloons", motif: "Grief becomes adventure — mailbox on porch still there when you land." },
  { key: "ocean_wave_call", tradition: "Ocean calling", motif: "Sea chooses a child — reef walk, grandmother's song, tide respects courage." },
  { key: "jungle_book_belong", tradition: "Jungle found family", motif: "Raised between worlds — wolf pack, bear song, choose your path home." },
  { key: "lion_king_circle", tradition: "Circle of life (gentle)", motif: "Stars remember kings — small cub grows, storm passes, savannah green again." },
  { key: "studio_ghibli_spirits", tradition: "Ghibli gentle spirits", motif: "Respect nature spirits — bathhouse steam, soot sprites, train on water, quiet moral." },
  { key: "kiki_delivery", tradition: "Young witch delivery", motif: "New town, broom courier — confidence lost and found over the sea." },
  { key: "totoro_bus_stop", tradition: "Forest spirit bus stop", motif: "Rain at stop — giant furry friend shares leaf umbrella, cat-bus streaks moon." },

  // Modern picture hits & diverse voices
  { key: "last_stop_market", tradition: "Last Stop on Market Street", motif: "Bus ride with nana — city beauty in rain, graffiti rainbow, gratitude." },
  { key: "hair_love", tradition: "Hair Love", motif: "Dad learns braid — mirror, patience, pride in natural crown." },
  { key: "alma_name", tradition: "Alma and How She Got Her Name", motif: "Long name tells family tree — each ancestor a story, child fits all pieces." },
  { key: "julián_mermaid", tradition: "Julián Is a Mermaid", motif: "Grandma's abuela eyes see mermaid dream — scarf tail, parade, accepted fully." },
  { key: "giraffes_cant_dance", tradition: "Giraffes Can't Dance", motif: "Wrong rhythm until right song — moonlit clearing, own dance discovered." },
  { key: "dot_ish_creativity", tradition: "The Dot / Ish", motif: "One mark becomes art — 'ish' is enough, creativity not perfection." },
  { key: "idea_egg", tradition: "What Do You Do With an Idea?", motif: "Tiny idea follows child — grows when nurtured, changes the world softly." },
  { key: "invisible_boy_seen", tradition: "The Invisible Boy", motif: "Quiet child overlooked — one kind invite makes colour return to page." },
  { key: "day_crayons_quit", tradition: "The Day the Crayons Quit", motif: "Colours write letters — each wants respect, rainbow compromise." },
  { key: "silly_pigeon_bus", tradition: "Pigeon series", motif: "Silly bird wants what child shouldn't give — child stays in charge, giggles." },

  // Bedtime-specific shapes
  { key: "star_whisper_wish", tradition: "Star wishes", motif: "First star — one whisper wish, constellation answers with wink not grant." },
  { key: "dream_library_card", tradition: "Dream library", motif: "Card checked out for one dream book — due at wake, no late fees." },
  { key: "moon_phase_calendar", tradition: "Moon phases", motif: "Moon grows and shrinks — child tracks calendar on window, sleepy crescent." },
  { key: "blanket_fort_castle", tradition: "Blanket fort", motif: "Chairs and sheet become castle — siege of yawns, defenders surrender to pillows." },
  { key: "lullaby_echo", tradition: "Lullaby echo", motif: "Song passed room to room — parent, wind, owl harmonise, last note on eyelids." },
  { key: "sandman_dust", tradition: "Sandman tradition", motif: "Golden dust on lashes — each grain a tiny dream door." },
  { key: "clock_backwards", tradition: "Time stretches", motif: "Bedtime clock kindly slow — one more minute becomes whole extra adventure in dream." },
  { key: "shoes_talking_walk", tradition: "Bedtime shoes", motif: "Slippers complain they're tired — socks negotiate, feet win truce." },
  { key: "cloud_pillow_swap", tradition: "Cloud pillow", motif: "Exchange pillow with cloud — one fluffy hour, rain tickles nose, swap back." },
  { key: "constellation_new", tradition: "New constellation", motif: "Child connects dots — new shape named after pet, sky remembers tonight." },

  // SA & outdoor flavour (non-specific)
  { key: "braai_stars", tradition: "Southern African night sky", motif: "Embers die, crickets start — Milky Way bright, elders' story shape in stars." },
  { key: "comrades_snail", tradition: "Slow journey win", motif: "Snail pace race — tortoise wisdom, finish line is pillow." },
  { key: "protea_garden", tradition: "Protea magic", motif: "National flower giant version — nectar for friendly mousebird, dawn pink." },
];

const RECENT_INSPIRATION_WINDOW = 12;

export function pickStoryInspiration(params: {
  storyNumber: number;
  recentInspirationKeys: string[];
}): StoryInspiration {
  const recent = new Set(
    params.recentInspirationKeys.filter(Boolean).slice(0, RECENT_INSPIRATION_WINDOW)
  );
  const candidates = STORY_INSPIRATION_LIBRARY.filter((item) => !recent.has(item.key));
  const pool = candidates.length > 0 ? candidates : STORY_INSPIRATION_LIBRARY;
  return pool[randomInt(pool.length)]!;
}

export function formatInspirationPrompt(inspiration: StoryInspiration): string {
  return (
    `CREATIVE INSPIRATION (original characters and plot only — do NOT copy names, lyrics, scenes, or plots from published works):\n` +
    `Tradition: ${inspiration.tradition}\n` +
    `Borrow this spirit: ${inspiration.motif}\n` +
    `Use mood and structure as seasoning — tonight's archetype and setting still lead.`
  );
}

export const STORY_INSPIRATION_COUNT = STORY_INSPIRATION_LIBRARY.length;
