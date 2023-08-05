const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

//////////////////////////////////////////////////////
// CONFIGURATION 

const is_nice = true
const generate_gives_from_costs = false

const TEMPLATE_HEROES = "./data/template_hero.html"
const TEMPLATE_ENCOUNTER = "./data/template_encounter.html"

const HERO_DIAMOND = "../assets/hero_bg_diamond.png"
const HERO_DIVIDER = "../assets/hero_bg_divider.png"
const ENCOUNTER_DIAMOND = "../assets/encounter_bg_diamond.png"

const ICON_BERRIES = { emoji: "🍇", image: "../assets/berry.png", image_small: "../assets/berry-small.png",  color: "border-berries", text: "Berries" }
const ICON_STICKS  = { emoji: "🪵", image: "../assets/stick.png", image_small: "../assets/stick-small.png",  color: "border-sticks",  text: "Sticks" }
const ICON_STONES  = { emoji: "🪨", image: "../assets/rock.png",  image_small: "../assets/rock-small.png",   color: "border-stones",  text: "Stones" }
const ICON_FLOWERS = { emoji: "🌼", image: "../assets/flower.png",image_small: "../assets/flower-small.png", color: "border-flowers", text: "Flowers" }
const ICON_WILD = { emoji: "❓", image: "../assets/wild.png",image_small: "../assets/wild-small.png", color: "border-wild", text: "Any Resource" }

const ICON_SPICE   = { emoji: "🌶️", image: "../assets/spicy-small.png", color: "", text: "(Spicy)" }
const ICON_ATTACK  = { emoji: "🗡️", image: "../assets/sword-small.png" }
const ICON_FIRE    = { emoji: "🔥", image: "../assets/fire-small.png" }
const ICON_CLOCK   = { emoji: "⏳", image: "../assets/time-small.png" }
const ICON_HEART   = { emoji: "❤️", image: "../assets/heart-small.png" }

// Occupations
const DECK_LIBRARIAN = { is_hero: true, path: "./data/source/Librarian - Cards.csv", emoji: "📚", image: "../assets/deck_icon_librarian.png" }
const DECK_GARDENER  = { is_hero: true, path: "./data/source/Gardener - Cards.csv",  emoji: "👩‍🌾", image: "../assets/deck_icon_gardener.png" }
const DECK_CHEF      = { is_hero: true, path: "./data/source/Chef - Cards.csv",     emoji: "👨‍🍳", image: "../assets/deck_icon_baker.png", spiced: true }
const DECK_CONSTABLE = { is_hero: true, path: "./data/source/Constable - Cards.csv", emoji: "👮", image: "../assets/deck_icon_constable.png" }

// Critters
const DECK_BEAR     = { is_hero: true,  path: "./data/source/Bear - Cards.csv",     emoji: "🐻", image: "../assets/deck_icon_bear.png"}
const DECK_SQUIRREL = { is_hero: true,  path: "./data/source/Squirrel - Cards.csv", emoji: "🐿️", image: "../assets/deck_icon_squirrel.png"}
const DECK_SNAKE    = { is_hero: true,  path: "./data/source/Snake - Cards.csv",    emoji: "🐍", image: "../assets/deck_icon_snake.png"}
const DECK_TURTLE   = { is_hero: true,  path: "./data/source/Turtle - Cards.csv",   emoji: "🐢", image: "../assets/deck_icon_turtle.png"}

// Encounter
const DECK_JAZZMONDIUS  = { is_encounter: true, path: "./data/source/Jazzmondius - Cards.csv",  emoji: "🦅", image: "../assets/deck_icon_jazzmondius.png" }
const DECK_WILDEFIRE    = { is_encounter: true, path: "./data/source/Wildfire - Cards.csv",    emoji: "🌋", image: "../assets/deck_icon_wildefire.png" }
const DECK_INSECT_SWARM = { is_encounter: true, path: "./data/source/The Swarm - Cards.csv", emoji: "🐝", image: "../assets/deck_icon_insecthorde.png" }
const DECK_TEMPEST = { is_encounter: true, path: "./data/source/The Tempest - Cards.csv", emoji: "🌧️", image: "" }

//////////////////////////////////////////////////////
// 

const decks = [
  DECK_LIBRARIAN,
  DECK_GARDENER, 
  DECK_CHEF,
  DECK_CONSTABLE,
  DECK_BEAR,
  DECK_SQUIRREL,
  DECK_SNAKE,
  DECK_TURTLE,
  DECK_JAZZMONDIUS,
  DECK_WILDEFIRE,
  DECK_INSECT_SWARM,
  DECK_TEMPEST
]

const html_preamble = `<html>
  <head>
    <link rel="stylesheet" href="CSS" />
  </head>
  <body>
    <div class="wrapper">
`
const html_postamble = `    </div>
  </body>
</html>`

const template_hero = fs.readFileSync(TEMPLATE_HEROES).toString()
const template_encounter = fs.readFileSync(TEMPLATE_ENCOUNTER).toString()

const inline_icons = [
  "🗡️",
  "❤️",
  "⏳",
  "🔥",
]

const icons = {
  "Wild": ICON_WILD,
  "Cost: Berries": ICON_BERRIES,
  "Cost: Sticks": ICON_STICKS,
  "Cost: Flowers": ICON_FLOWERS,
  "Cost: Stones": ICON_STONES,
  "Gives: Berries": ICON_BERRIES,
  "Gives: Sticks": ICON_STICKS,
  "Gives: Flowers": ICON_FLOWERS,
  "Gives: Stones": ICON_STONES,
  "🗡️": ICON_ATTACK,
  "❤️": ICON_HEART,
  "⏳": ICON_CLOCK,
  "🔥": ICON_FIRE,
}

const encounter_suffixes = {
  "Attack": ICON_ATTACK,
  "Health": ICON_HEART,
  "Duration": ICON_CLOCK,
  "Fire": ICON_FIRE,
}

function
icon_spec_to_html_no_class(icon_spec)
{
  if (!icon_spec) return null
  if (is_nice) {
    return `<img class="cost_icon" src="${icon_spec.image}" />`
  } else {
    return `${icon_spec.emoji}`
  }
}

function 
icon_spec_to_html(icon_spec, small = false, spiced = false)
{
  if (!icon_spec) return null
  if (is_nice) {
    const image = small ? icon_spec.image_small : icon_spec.image
    return `<div class="icon_wrapper"><img class="cost_icon" src="${image}" />${ (spiced) ? `<img class="cost_icon spiced" src="${ICON_SPICE.image}" />` : ""}</div>`
  } else {
    return `<div class="icon_wrapper"><div class="cost_icon">${icon_spec.emoji}</div>${(spiced) ? `<div class="cost_icon spiced">${ICON_SPICE.emoji}</div>` : ""}</div>`
  }
}

function 
get_resource_icon(icon_key)
{
  const spec = icons[icon_key]
  return spec
}

function
get_deck_icon(deck_spec)
{
  const diamond = deck_spec.is_hero ? HERO_DIAMOND : ENCOUNTER_DIAMOND
  return is_nice ? `<img class="deck_icon" src="${deck_spec.image}" /><img class="deck diamond" src="${diamond}">` : deck_spec.emoji
}

function 
insert_costs(insert, costs) 
{
  let cost_html = ""
  for (let i = 0; i < costs.length; i++) {
    const cost = costs[i]
    const icon = get_resource_icon(cost.key)
    for (let j = 0; j < cost.value; j++) {
      cost_html += icon_spec_to_html(icon, true)
    }
  }
  return insert.replace("%Costs%", cost_html)
}

function 
insert_gives(insert, gives, spiced) 
{
  let gives_icons = ""
  let gives_text = []
  let color = ""
 
  // Replace with wild if all resources are present
  if (gives.length > 3) {
    const icon = get_resource_icon("Wild")
    gives_icons += icon_spec_to_html(icon, false, spiced)
    gives_text.push(icon.text)
  }
  else {
    // Generate each cost symbol seperately
    for (let i = 0; i < gives.length; i++) {
      const give = gives[i]
      const icon = get_resource_icon(give.key)
      color = icon.color
      // Add a slash between te sybols
      if (gives_icons != "") {
        gives_icons += " / "
      }
      gives_icons += icon_spec_to_html(icon, false, spiced)
      gives_text.push(icon.text)
    }
  }

  //gives_text = (spiced) ? ICON_SPICE.text + ": " + gives_text.join(" or ") : gives_text.join(" or ")
  gives_text = gives_text.join(" or ")
  gives_icons = `<div class="icon ${color}">${gives_icons}</div>`

  const divider = is_nice ? `<img class="divider" src = "${HERO_DIVIDER}" />` : ""
  insert = insert.replace("%Gives Divider%", divider)
  insert = insert.replace("%Gives Icon%", gives_icons)
  insert = insert.replace("%Gives Name%", gives_text)
  return insert
}


function
insert_counts(insert, count)
{
  let count_icons = ""
  for (let j = 0; j < count; j++) {
    count_icons += (is_nice) ? "⚫️ " : "• "
  }
  insert = insert.replace("%CountIcons%", count_icons)
  return insert
}

async function 
parse_csv(file)
{
  const file_path = file.path
  const path_parsed = path.parse(file_path)
  console.log("READING", file_path)
  console.log("  BASENAME", path_parsed.name)
  const file_data = fs.readFileSync(file_path, "utf-8");
  let rows_formatted = file_data.replace(/\r/g, "")

  const rows = await parse(rows_formatted, { columns: true, delimiter: "," })

  return {
    rows, name: path_parsed.name
  }
}

function
should_page_break(row_i)
{
  return row_i != 0 && (row_i % 6) == 0
}

function
insert_page_break(i)
{
  return `
    <div class='page-break'></div>
    <div class='page-break'></div>
    <div class='page-break'></div>
  `
}

function
modified_description(desc)
{
  let html = ""

  // Insert paragraphs
  const paragraphs = desc.split("\n")
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i]
    html += `<div class="body_section">${paragraph}</div>`
  }

  // Replace icons
  if (is_nice) {
    for (let i = 0; i < inline_icons.length; i++) {
      const emoji = inline_icons[i]
      const icon = get_resource_icon(emoji)
      html = html.replaceAll(emoji, icon_spec_to_html_no_class(icon))
    }
  }

  return html
}

function 
gen_hero(rows, name, deck_spec) 
{
  let inserted = 0
  let html = ""
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    let insert = template_hero;
    let keys = Object.keys(row)
    let costs = []
    let gives = []
    for (let j = 0; j < keys.length; j++) {
      const key = keys[j]
      const value = row[key]
      if (key.includes("Cost")) {
        const count = value == "" ? 0 : parseInt(value)
        if (count > 0) {
          costs.push({
            key, value: count
          })
        }
      } else if (key.includes("Gives")) {
        const count = value == "" ? 0 : parseInt(value)
        if (count > 0) {
          gives.push({ key, value })
        }
      } 
      else if (key == "Description") {
        insert = insert.replace(`%Description%`, modified_description(value))
      } else {
        insert = insert.replace(`%${key}%`, value.trim())
      }
    }

    insert = insert_costs(insert, costs)
    insert = generate_gives_from_costs ? insert_gives(insert, costs, deck_spec.spiced) : insert_gives(insert, gives, deck_spec.spiced)

    const freq = row["Frequency"]
    if (freq != "") insert = insert_counts(insert, freq)
    
    
    const count = parseInt(row["Count"])
    const secondDeck = (is_nice) ? get_deck_icon(deck_spec) : ""
    insert = insert.replace("%Deck%", get_deck_icon(deck_spec))
    insert = insert.replace("%SecondDeck%", secondDeck)
    insert = insert.replace("%DeckName%", name.replace(" - Cards", ""))

    for (let j = 0; j < count; j++) {
      html += insert
      inserted += 1
      if (should_page_break(inserted)) html += insert_page_break(inserted)
    }
  }
  return html
}

function
encounter_with_suffix(key, value)
{
  const suffix = icon_spec_to_html_no_class(encounter_suffixes[key])
  if (!suffix) return `${value.trim()}`
  return `${value.trim()} ${suffix}`
}

function
stupid_fucking_emoji_string_length(str, emoji) {
  let string_left = str
  let emojis_found = 0
  while (string_left.length > 0) {
    const index_of = string_left.indexOf(emoji)
    if (index_of >= 0) {
      string_left = string_left.replace(emoji, "")
      emojis_found += 1
    } else {
      break
    }
  }
  return emojis_found
}

function
gen_encounter(rows, name, deck_spec)
{
  let html = ""
  let inserted = 0
  for (let i = 0; i < rows.length; i++) 
  {
    const row = rows[i]

    let insert = template_encounter;
    let keys = Object.keys(row)

    for (let j = 0; j < keys.length; j++) {
      const key = keys[j]
      const value = row[key]
      if (key === "Icons") continue

      if (key == "Description") {
        insert = insert.replace(`%Description%`, modified_description(value))
      }
      else if (key == "Duration" || key == "Attack" || key == "Health") {
        insert = insert.replace(`%${key}%`, `<div class ="number_icon ${key} ${(value == "") ? "hidden" : ""}">${encounter_with_suffix(key, value.replace(/\D/g,''))}</div>`)
      }
      else {
        insert = insert.replace(`%${key}%`, encounter_with_suffix(key, value))
      }
    }

    if (row["Icons"] != "") {
      const fire_count = stupid_fucking_emoji_string_length(row["Icons"], "🔥")
      let icons = ""
      for (let j = 0; j < fire_count; j++) {
        icons += icon_spec_to_html(ICON_FIRE, false)
      }
      insert = insert.replace("%Icons%", `<div class ="icons ${(fire_count == 0) ? "hidden" : ""}">${icons}</div>`)
    }

    const not_replaced = keys.filter(key => row[key] == "")
    for (let j = 0; j < not_replaced.length; j++) {
      const key = not_replaced[j]
      insert = insert.replace(`%${key}%`, "")
    }
    
    insert = insert.replace("%Deck%", get_deck_icon(deck_spec))
    insert = insert.replace("%DeckName%", name.replace(" - Cards", ""))
    
    const count = parseInt(row["Count"])
    insert = insert_counts(insert, count)
    
    for (let j = 0; j < count; j++) {
      html += insert
      inserted += 1
      if (should_page_break(inserted)) html += insert_page_break(inserted)
    }
  }
  return html
}

decks.forEach(deck_spec => {
  parse_csv(deck_spec)
    .then(({ rows, name }) => {
      let html_body = ""
      if (deck_spec.is_hero) {
        html_body = gen_hero(rows, name, deck_spec)
      } else if (deck_spec.is_encounter) {
        html_body = gen_encounter(rows, name, deck_spec)
      }
      html = html_preamble.replace("CSS", is_nice ? "../template_nice.css" : "../template_bare.css")
      html += html_body
      html += html_postamble

      // Remove leading tabs
      const lines = html.split("\n")
      const lines_trimmed = lines.map(line => line.trim())
      html = lines_trimmed.join("\n")
      
      fs.writeFileSync(`./data/output/${name}.html`, html)
    })
})