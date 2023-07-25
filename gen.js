const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

//////////////////////////////////////////////////////
// CONFIGURATION 

const is_nice = true
const generate_gives_from_costs = true

const TEMPLATE_HEROES = "./data/template_hero.html"
const TEMPLATE_ENCOUNTER = "./data/template_encounter.html"

const ICON_BERRIES = { emoji: "🍓", image: "../assets/berry.png", image_small: "../assets/berry-small.png",  color: "border-berries", text: "Berries" }
const ICON_STICKS  = { emoji: "🌿", image: "../assets/stick.png", image_small: "../assets/stick-small.png",  color: "border-sticks",  text: "Sticks" }
const ICON_STONES  = { emoji: "🪨", image: "../assets/rock.png",  image_small: "../assets/rock-small.png",   color: "border-stones",  text: "Stones" }
const ICON_FLOWERS = { emoji: "🌸", image: "../assets/flower.png",image_small: "../assets/flower-small.png", color: "border-flowers", text: "Flowers" }
const ICON_WILD = { emoji: "❓", image: "../assets/wild.png",image_small: "../assets/wild-small.png", color: "border-wild", text: "Any Resource" }

const ICON_SPICE   = { emoji: "🌶️", image: "../assets/spicy.png", color: "", text: "(Spiced)" }
const ICON_ATTACK  = { emoji: "🗡️", image: "../assets/sword-small.png" }
const ICON_FIRE    = { emoji: "🔥", image: "../assets/fire-small.png" }
const ICON_CLOCK   = { emoji: "⏳", image: "../assets/time-small.png" }
const ICON_HEART   = { emoji: "❤️", image: "../assets/heart-small.png" }

// Occupations
const DECK_LIBRARIAN = { is_hero: true, path: "./data/Librarian - Sheet1.csv", emoji: "📚", image: "../assets/deck_icon_librarian.png" }
const DECK_GARDENER  = { is_hero: true, path: "./data/Gardener - Sheet1.csv",  emoji: "👩‍🌾", image: "../assets/deck_icon_gardener.png" }
const DECK_CHEF      = { is_hero: true, path: "./data/Baker - Sheet1.csv",     emoji: "👨‍🍳", image: "../assets/deck_icon_baker.png", spiced: true }
const DECK_CONSTABLE = { is_hero: true, path: "./data/Constable - Sheet1.csv", emoji: "👮", image: "../assets/deck_icon_constable.png" }

// Critters
const DECK_BEAR     = { is_hero: true,  path: "./data/Bear - Sheet1.csv",     emoji: "🐻", image: "../assets/deck_icon_bear.png"}
const DECK_SQUIRREL = { is_hero: true,  path: "./data/Squirrel - Sheet1.csv", emoji: "🐿️", image: "../assets/deck_icon_squirrel.png"}
const DECK_SNAKE    = { is_hero: true,  path: "./data/Snake - Sheet1.csv",    emoji: "🐍", image: "../assets/deck_icon_snake.png"}
const DECK_TURTLE   = { is_hero: true,  path: "./data/Turtle - Sheet1.csv",   emoji: "🐢", image: "../assets/deck_icon_turtle.png"}

// Encounter
const DECK_JAZZMONDIUS  = { is_encounter: true, path: "./data/Jazzmondius - Sheet1.csv",  emoji: "🦅", image: "../assets/deck_icon_jazzmondius.png" }
const DECK_WILDEFIRE    = { is_encounter: true, path: "./data/Wildfire - Sheet1.csv",    emoji: "🔥", image: "../assets/deck_icon_wildefire.png" }
const DECK_INSECT_SWARM = { is_encounter: true, path: "./data/The Swarm - Sheet1.csv", emoji: "🐝", image: "../assets/deck_icon_insecthorde.png" }

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
    return icon_spec.emoji
  }
}

function 
icon_spec_to_html(icon_spec, small = false, spiced = false)
{
  if (!icon_spec) return null
  if (is_nice) {
    const image = small ? icon_spec.image_small : icon_spec.image
    return (spiced) ? `<div class="icon_wrapper"><img class="cost_icon" src="${image}" /><img class="cost_icon spiced" src="${ICON_SPICE.image}" /></div>` : `<img class="cost_icon" src="${image}" />`
  } else {
    return `<div class="cost_icon">${icon_spec.emoji}</div>`
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
  return is_nice ? `<img class="deck_icon" src="${deck_spec.image}" />` : deck_spec.emoji
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

  gives_text = (spiced) ? ICON_SPICE.text + ": " + gives_text.join(" / ") : gives_text.join(" / ")
  gives_icons = `<div class="icon ${color}">${gives_icons}</div>`

  insert = insert.replace("%Gives Icon%", gives_icons)
  insert = insert.replace("%Gives Name%", gives_text)
  return insert
}


function
insert_counts(insert, count)
{
  let count_icons = ""
  for (let j = 0; j < count; j++) {
    count_icons += "⚫️ "
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
      } else {
        insert = insert.replace(`%${key}%`, value.trim())
      }
    }

    insert = insert_costs(insert, costs)
    insert = generate_gives_from_costs ? insert_gives(insert, costs, deck_spec.spiced) : insert_gives(insert, gives, deck_spec.spiced)

    const freq = row["Frequency"]
    if (freq != "") insert = insert_counts(insert, freq)
    
    
    const count = parseInt(row["Count"])
    insert = insert.replace("%Deck%", get_deck_icon(deck_spec))

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
  if (!suffix) return value.trim()
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
      if (value != "") {
        insert = insert.replace(`%${key}%`, encounter_with_suffix(key, value))
      }
    }

    if (row["Icons"] != "") {
      const fire_count = stupid_fucking_emoji_string_length(row["Icons"], "🔥")
      let icons = ""
      for (let j = 0; j < fire_count; j++) {
        icons += icon_spec_to_html(ICON_FIRE, true)
      }
      console.log(fire_count)
      insert = insert.replace("%Icons%", icons)
    }

    const not_replaced = keys.filter(key => row[key] == "")
    for (let j = 0; j < not_replaced.length; j++) {
      const key = not_replaced[j]
      insert = insert.replace(`%${key}%`, "")
    }

    insert = insert.replace("%Deck%", get_deck_icon(deck_spec))
    
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